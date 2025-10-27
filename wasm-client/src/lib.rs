// Copyright (c) Zefchain Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/*!
# `linera-web`

This module defines the JavaScript bindings to the client API.

It is compiled to Wasm, with a JavaScript wrapper to inject its imports, and published on
NPM as `@linera/client`.

There is a supplementary package `@linera/signer`, contained within the `signer`
subdirectory, that defines signer implementations for different transaction-signing
policies, including in-memory keys and signing using an existing MetaMask wallet.
*/

// We sometimes need functions in this module to be async in order to
// ensure the generated code will return a `Promise`.
#![allow(clippy::unused_async)]
#![recursion_limit = "256"]

pub mod signer;
pub mod utils;

use std::{
    collections::{BTreeMap, HashMap},
    future::Future,
    ops::Deref,
    panic,
    str::FromStr,
    sync::Arc,
    time::Duration,
};

use futures::{future::FutureExt as _, lock::Mutex as AsyncMutex, stream::StreamExt};
use linera_base::{
    data_types::Timestamp,
    identifiers::{AccountOwner, ApplicationId, ChainId},
};
use linera_client::{
    chain_listener::{ChainListener, ChainListenerConfig, ClientContext as _},
    client_options::ClientContextOptions,
    config::GenesisConfig,
    wallet::{UserChain, Wallet},
};
use linera_core::{
    data_types::ClientOutcome,
    node::{ValidatorNode as _, ValidatorNodeProvider as _},
};
use linera_faucet_client::Faucet;
use linera_persistent::{self as persistent, Persist, PersistExt};
use linera_views::store::WithError;
use serde::ser::Serialize as _;
use wasm_bindgen::prelude::*;
use web_sys::{js_sys, wasm_bindgen};

use crate::{
    signer::JsSigner,
    utils::{IndexedDbStorage, WalletStorage},
};

// TODO(#12): convert to IndexedDbStore once we refactor Context
type WebStorage =
    linera_storage::DbStorage<linera_views::memory::MemoryDatabase, linera_storage::WallClock>;

type WebEnvironment =
    linera_core::environment::Impl<WebStorage, linera_rpc::node_provider::NodeProvider, JsSigner>;

type JsResult<T> = Result<T, JsError>;

async fn get_storage(
) -> Result<WebStorage, <linera_views::memory::MemoryDatabase as WithError>::Error> {
    linera_storage::DbStorage::maybe_create_and_connect(
        &linera_views::memory::MemoryStoreConfig {
            max_stream_queries: 1,
            kill_on_drop: false,
        },
        "linera",
        Some(linera_execution::WasmRuntime::Wasmer),
    )
    .await
}

/// A wallet that stores the user's chains and keys in memory.
#[wasm_bindgen(js_name = "Wallet")]
pub struct PersistentWallet {
    wallet: persistent::Memory<Wallet>,
    storage: IndexedDbStorage,
}

impl Deref for PersistentWallet {
    type Target = Wallet;

    fn deref(&self) -> &Self::Target {
        &self.wallet
    }
}

use std::error::Error as StdError;
use std::fmt;

#[derive(Debug)]
pub struct WasmPersistError {
    inner: String,
}

impl WasmPersistError {
    pub fn new(msg: impl Into<String>) -> Self {
        Self { inner: msg.into() }
    }
}

impl fmt::Display for WasmPersistError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.inner)
    }
}

impl StdError for WasmPersistError {}

// These are safe in single-threaded WASM
unsafe impl Send for WasmPersistError {}
unsafe impl Sync for WasmPersistError {}

// Convert from JsError
impl From<JsError> for WasmPersistError {
    fn from(e: JsError) -> Self {
        Self::new(format!("{:?}", e))
    }
}

impl From<serde_json::Error> for WasmPersistError {
    fn from(e: serde_json::Error) -> Self {
        Self::new(e.to_string())
    }
}

// Implement Persist trait
impl Persist for PersistentWallet {
    type Error = WasmPersistError;

    fn as_mut(&mut self) -> &mut Self::Target {
        self.wallet.as_mut()
    }

    async fn persist(&mut self) -> Result<(), Self::Error> {
        // Save to IndexedDB
        self.save_to_storage(false)
            .await
            .map_err(|e| JsError::new(&format!("Failed to persist wallet: {:?}", e)))?;

        Ok(())
    }

    fn into_value(self) -> Self::Target {
        self.wallet.into_value()
    }
}

type ClientContext = linera_client::client_context::ClientContext<WebEnvironment, PersistentWallet>;

// linera_client::client_context::ClientContext<WebEnvironment, persistent::Memory<Wallet>>;
type ChainClient = linera_core::client::ChainClient<WebEnvironment>;

// TODO(#13): get from user
pub const OPTIONS: ClientContextOptions = ClientContextOptions {
    send_timeout: linera_base::time::Duration::from_millis(4000),
    recv_timeout: linera_base::time::Duration::from_millis(4000),
    max_pending_message_bundles: 10,
    retry_delay: linera_base::time::Duration::from_millis(1000),
    max_retries: 10,
    wait_for_outgoing_messages: false,
    blanket_message_policy: linera_core::client::BlanketMessagePolicy::Accept,
    restrict_chain_ids_to: None,
    long_lived_services: false,
    blob_download_timeout: linera_base::time::Duration::from_millis(1000),
    certificate_batch_download_timeout: linera_base::time::Duration::from_millis(1000),
    certificate_download_batch_size: linera_core::client::DEFAULT_CERTIFICATE_DOWNLOAD_BATCH_SIZE,
    sender_certificate_download_batch_size:
        linera_core::client::DEFAULT_SENDER_CERTIFICATE_DOWNLOAD_BATCH_SIZE,
    chain_worker_ttl: Duration::from_secs(30),
    sender_chain_worker_ttl: Duration::from_millis(200),
    grace_period: linera_core::DEFAULT_GRACE_PERIOD,
    max_joined_tasks: 100,

    // TODO(linera-protocol#2944): separate these out from the
    // `ClientOptions` struct, since they apply only to the CLI/native
    // client
    wallet_state_path: None,
    keystore_path: None,
    with_wallet: None,
    chrome_trace_exporter: false,
    otel_trace_file: None,
    otel_exporter_otlp_endpoint: None,
};

#[wasm_bindgen(js_name = Faucet)]
pub struct JsFaucet(Faucet);

#[wasm_bindgen(js_class = "Faucet")]
impl JsFaucet {
    #[wasm_bindgen(constructor)]
    #[must_use]
    pub fn new(url: String) -> JsFaucet {
        JsFaucet(Faucet::new(url))
    }

    /// Creates a new wallet from the faucet.
    ///
    /// # Errors
    /// If we couldn't retrieve the genesis config from the faucet.
    #[wasm_bindgen(js_name = createWallet)]
    pub async fn create_wallet(&self) -> JsResult<PersistentWallet> {
        let storage = IndexedDbStorage::new("linera", "ldb", 2u32);
        let wallet = persistent::Memory::new(linera_client::wallet::Wallet::new(
            self.0.genesis_config().await?,
        ));

        let p = PersistentWallet::new(wallet, storage);
        p.save_to_storage(true).await.map_err(|e| {
            tracing::error!("save_to_storage failed: {:?}", e);
            e
        })?;
        Ok(p)
    }

    // TODO(#40): figure out a way to alias or specify this string for TypeScript
    /// Claims a new chain from the faucet, with a new keypair and some tokens.
    ///
    /// # Errors
    /// - if we fail to get the list of current validators from the faucet
    /// - if we fail to claim the chain from the faucet
    /// - if we fail to persist the new chain or keypair to the wallet
    ///
    /// # Panics
    /// If an error occurs in the chain listener task.
    #[wasm_bindgen(js_name = claimChain)]
    pub async fn claim_chain(
        &self,
        wallet: &mut PersistentWallet,
        owner: JsValue,
    ) -> JsResult<String> {
        use persistent::PersistExt as _;
        let account_owner: AccountOwner = serde_wasm_bindgen::from_value(owner)?;
        let description = self.0.claim(&account_owner).await?;
        wallet
            .wallet
            .mutate(|wallet| {
                wallet.assign_new_chain_to_owner(
                    account_owner,
                    description.id(),
                    description.timestamp(),
                )
            })
            .await??;

        wallet.save_to_storage(false).await?;

        Ok(description.id().to_string())
    }
}

#[wasm_bindgen(js_class = "Wallet")]
impl PersistentWallet {
    /// Attempts to read the wallet from persistent storage.
    ///
    /// # Errors
    /// If storage is inaccessible.
    #[wasm_bindgen(js_name = "get")]
    pub async fn get() -> Result<Option<PersistentWallet>, JsError> {
        let storage = IndexedDbStorage::new("linera", "ldb", 2u32);
        let chains_result = storage.read_field("chains").await?;
        let default_result = storage.read_field("default").await?;
        let genesis_result = storage.read_field("genesis").await?;

        let chains_val = match chains_result {
            Some(val) => val,
            None => return Ok(None),
        };
        let default_val = match default_result {
            Some(ref val) => val,
            None => return Ok(None),
        };
        let genesis_val = match genesis_result {
            Some(val) => val,
            None => return Ok(None),
        };

        // Chains: stored as JS Map - use serde_wasm_bindgen directly
        let chains: BTreeMap<ChainId, UserChain> = serde_wasm_bindgen::from_value(chains_val)
            .map_err(|e| JsError::new(&format!("Failed to deserialize chains: {e}")))?;

        // Genesis: stored as JSON string - parse it first
        let genesis_config: GenesisConfig = if let Some(json_str) = genesis_val.as_string() {
            serde_json::from_str(&json_str)
                .map_err(|e| JsError::new(&format!("Failed to deserialize genesis: {e}")))?
        } else {
            serde_wasm_bindgen::from_value(genesis_val)
                .map_err(|e| JsError::new(&format!("Failed to deserialize genesis: {e}")))?
        };

        // Default: stored as plain string (chain ID) or null
        let default: Option<ChainId> = if let Some(ref val) = default_result {
            if val.is_null() || val.is_undefined() {
                None
            } else if let Some(chain_id_str) = val.as_string() {
                // Parse the string as ChainId directly
                Some(
                    serde_json::from_str(&format!("\"{}\"", chain_id_str))
                        .map_err(|e| JsError::new(&format!("Failed to parse chain ID: {e}")))?,
                )
            } else {
                // Try deserializing as object
                serde_wasm_bindgen::from_value(val.clone()).ok()
            }
        } else {
            None
        };

        // Construct the Wallet struct manually from individual fields
        let mut wallet = Wallet::new(genesis_config);

        wallet.chains = chains;
        wallet.default = default;

        let memory_wallet = persistent::Memory::new(wallet);

        let p = PersistentWallet::new(memory_wallet, storage);

        Ok(Some(p))
    }

    /// This methods returns the Wallet stored in string format, that could be parsed into json.
    #[wasm_bindgen(js_name = "readJsWallet")]
    pub async fn read_js_wallet() -> Result<String, JsError> {
        let storage = IndexedDbStorage::new("linera", "ldb", 2u32);
        let chains = storage.read_field("chains").await?;
        let default = storage.read_field("default").await?;

        let chains_val: serde_json::Value = match chains {
            Some(jsv) => serde_wasm_bindgen::from_value(jsv)
                .map_err(|e| JsError::new(&format!("Failed to deserialize chains: {}", e)))?,
            None => serde_json::json!({}),
        };

        let default_val: serde_json::Value = match default {
            Some(jsv) => serde_wasm_bindgen::from_value(jsv)
                .map_err(|e| JsError::new(&format!("Failed to deserialize chains: {}", e)))?,
            None => serde_json::json!({}),
        };

        // Create combined object
        let combined = serde_json::json!({
            "chains": chains_val,
            "default": default_val,
        });

        // Serialize combined object to a JSON string
        let combined_str = serde_json::to_string(&combined)
            .map_err(|e| JsError::new(&format!("Failed to serialize combined wallet: {}", e)))?;

        Ok(combined_str)
    }

    /// Takes wallet in string format parses it and updates the Store
    #[wasm_bindgen(js_name = "setJsWallet")]
    pub async fn set_js_wallet(wallet_json: &str) -> Result<PersistentWallet, JsError> {
        let wallet: Wallet = serde_json::from_str(wallet_json)
            .map_err(|e| JsError::new(&format!("Failed to deserialize wallet JSON: {e}")))?;
        let storage = IndexedDbStorage::new("linera", "ldb", 2u32);

        let memory_wallet = persistent::Memory::new(wallet);

        let p = PersistentWallet::new(memory_wallet, storage);
        p.save_to_storage(true).await?;

        Ok(p)
    }

    pub async fn save_to_storage(&self, gn_flag: bool) -> Result<(), JsError> {
        let chains_value = serde_wasm_bindgen::to_value(&self.wallet.chains)
            .map_err(|e| JsError::new(&format!("Failed to serialize chains: {}", e)))?;
        let default_value = serde_wasm_bindgen::to_value(&self.wallet.default)
            .map_err(|e| JsError::new(&format!("Failed to serialize default: {}", e)))?;
        let mut fields = vec![
            ("chains".to_string(), chains_value),
            ("default".to_string(), default_value),
        ];

        if gn_flag {
            let genesis_json = serde_json::to_string(self.wallet.genesis_config())
                .map_err(|e| JsError::new(&format!("Failed to serialize genesis: {}", e)))?;
            fields.push(("genesis".to_string(), JsValue::from_str(&genesis_json)));
        }
        let result = self.storage.write_fields(fields).await;
        result
    }

    #[wasm_bindgen(js_name = assignChain)]
    pub async fn assign_chain(
        &mut self,
        owner: JsValue,
        chain_id: String,
        timestamp: JsValue,
    ) -> Result<(), JsError> {
        use linera_base::identifiers::{AccountOwner, ChainId};
        use std::str::FromStr;

        // Parse inputs
        let account_owner: AccountOwner =
            serde_wasm_bindgen::from_value(owner).map_err(|e| JsError::new(&format!("{:?}", e)))?;
        let chain_id = ChainId::from_str(&chain_id)
            .map_err(|e| JsError::new(&format!("Invalid ChainId: {:?}", e)))?;
        let timestamp: Timestamp = serde_wasm_bindgen::from_value(timestamp)
            .map_err(|e| JsError::new(&format!("{:?}", e)))?;

        // Persist assignment to the wallet: timestamp and epoch are taken from description.
        self.wallet
            .mutate(|w| w.assign_new_chain_to_owner(account_owner, chain_id, timestamp))
            .await
            .map_err(|e| JsError::new(&format!("Persistence error: {:?}", e)))?
            .map_err(|e| JsError::new(&format!("Assign error: {:?}", e)))?;

        self.wallet
            .mutate(|w| w.set_default_chain(chain_id))
            .await
            .map_err(|e| JsError::new(&format!("Persistence error: {:?}", e)))?
            .map_err(|e| JsError::new(&format!("default chain update error: {:?}", e)))?;

        self.save_to_storage(false)
            .await
            .expect("failed to save wallet after assign");

        Ok(())
    }

    /// Use to update default chain with new chain
    #[wasm_bindgen(js_name = setDefault)]
    pub async fn set_default_chain(&mut self, chain_id: String) -> JsResult<()> {
        let chain_id = ChainId::from_str(&chain_id).unwrap();
        self.wallet
            .mutate(|w| w.set_default_chain(chain_id))
            .await
            .map_err(|e| JsError::new(&format!("Persistence error: {:?}", e)))?
            .map_err(|e| JsError::new(&format!("Assign error: {:?}", e)))?;

        self.save_to_storage(false)
            .await
            .expect("failed to set default chain");

        Ok(())
    }
}

impl PersistentWallet {
    pub fn new(wallet: persistent::Memory<Wallet>, storage: IndexedDbStorage) -> Self {
        Self { wallet, storage }
    }
}

/// The full client API, exposed to the wallet implementation. Calls
/// to this API can be trusted to have originated from the user's
/// request. This struct is the backend for the extension itself
/// (side panel, option page, et cetera).
#[wasm_bindgen]
#[derive(Clone)]
pub struct Client {
    // This use of `futures::lock::Mutex` is safe because we only
    // expose concurrency to the browser, which must always run all
    // futures on the global task queue.
    client_context: Arc<AsyncMutex<ClientContext>>,
}

/// The subset of the client API that should be exposed to application
/// frontends. Any function exported here with `wasm_bindgen` can be
/// called by untrusted Web pages, and so inputs must be verified and
/// outputs must not leak sensitive information without user
/// confirmation.
#[wasm_bindgen]
#[derive(Clone)]
pub struct Frontend(Client);

#[derive(serde::Deserialize)]
struct TransferParams {
    donor: Option<AccountOwner>,
    amount: u64,
    recipient: linera_base::identifiers::Account,
}

#[wasm_bindgen]
impl Client {
    /// Creates a new client and connects to the network.
    ///
    /// # Errors
    /// On transport or protocol error, or if persistent storage is
    /// unavailable.
    #[wasm_bindgen(constructor)]
    pub async fn new(
        wallet: PersistentWallet,
        signer: JsSigner,
        skip_process_inbox: bool,
    ) -> Result<Client, JsError> {
        let mut storage = get_storage().await?;
        wallet
            .wallet
            .genesis_config()
            .initialize_storage(&mut storage)
            .await?;
        // The `Arc` here is useless, but it is required by the `ChainListener` API.
        #[expect(clippy::arc_with_non_send_sync)]
        let client_context = Arc::new(AsyncMutex::new(ClientContext::new(
            storage.clone(),
            OPTIONS,
            wallet,
            signer,
        )));

        // CRITICAL: Synchronize all chains before starting listener
        {
            let mut guard = client_context.lock().await;
            let chain_ids: Vec<_> = guard.wallet().chain_ids();
            for chain_id in chain_ids {
                let client = guard.make_chain_client(chain_id);
                client.synchronize_from_validators().await?;
                guard.update_wallet(&client).await?;
            }
        }

        let client_context_clone = client_context.clone();
        let chain_listener = ChainListener::new(
            ChainListenerConfig {
                skip_process_inbox,
                ..ChainListenerConfig::default()
            },
            client_context_clone,
            storage,
            tokio_util::sync::CancellationToken::new(),
        )
        .run(true) // Enable background sync
        .await?;

        wasm_bindgen_futures::spawn_local(
            async move {
                if let Err(error) = chain_listener.await {
                    tracing::error!("ChainListener error: {error:?}");
                }
            }
            .boxed_local(),
        );
        log::info!("Linera Web client successfully initialized");
        Ok(Self { client_context })
    }

    /// Assigns a chain to the provided wallet key using only the ChainId (string).
    /// `RESERVED` might need in the future
    #[wasm_bindgen(js_name = assignChain)]
    pub async fn assign_chain(
        &self,
        wallet: &mut PersistentWallet,
        owner: JsValue,
        chain_id: String,
    ) -> Result<(), JsError> {
        use linera_base::identifiers::{AccountOwner, ChainId};
        use std::str::FromStr;

        // Parse inputs
        let account_owner: AccountOwner =
            serde_wasm_bindgen::from_value(owner).map_err(|e| JsError::new(&format!("{:?}", e)))?;
        let chain_id = ChainId::from_str(&chain_id)
            .map_err(|e| JsError::new(&format!("Invalid ChainId: {:?}", e)))?;

        // Acquire the client context to create a ChainClient for the target chain.
        // `client_context` is an Arc<AsyncMutex<ClientContext>> stored on `Client`.
        let context = self.client_context.lock().await;

        // Create a chain client for the chain id and fetch its description.
        let chain_client = context.make_chain_client(chain_id);
        let chain_description = chain_client
            .get_chain_description()
            .await
            .map_err(|e| JsError::new(&format!("Failed to fetch ChainDescription: {:?}", e)))?;

        // Verify the owner is accepted by the chain ownership config.
        let config = chain_description.config();
        if !config.ownership.verify_owner(&account_owner) {
            return Err(JsError::new(
                "The chain ownership does not verify for the provided owner (check owner key)",
            ));
        }

        // Persist assignment to the wallet: timestamp and epoch are taken from description.
        let timestamp = chain_description.timestamp();
        wallet
            .wallet
            .mutate(|w| w.assign_new_chain_to_owner(account_owner, chain_id, timestamp))
            .await
            .map_err(|e| JsError::new(&format!("Persistence error: {:?}", e)))?
            .map_err(|e| JsError::new(&format!("Assign error: {:?}", e)))?;

        Ok(())
    }
    /// Sets a callback to be called when a notification is received
    /// from the network.
    ///
    /// # Panics
    /// If the handler function fails or we fail to subscribe to the
    /// notification stream.
    #[wasm_bindgen(js_name = onNotification)]
    pub fn on_notification(&self, handler: js_sys::Function) {
        let this = self.clone();
        wasm_bindgen_futures::spawn_local(async move {
            let mut notifications = this
                .default_chain_client()
                .await
                .unwrap()
                .subscribe()
                .unwrap();
            while let Some(notification) = notifications.next().await {
                tracing::debug!("received notification: {notification:?}");
                handler
                    .call1(
                        &JsValue::null(),
                        &serde_wasm_bindgen::to_value(&notification).unwrap(),
                    )
                    .unwrap();
            }
        });
    }

    async fn default_chain_client(&self) -> Result<ChainClient, JsError> {
        let client_context = self.client_context.lock().await;
        let chain_id = client_context
            .wallet()
            .default_chain()
            .expect("A default chain should be configured");
        Ok(client_context.make_chain_client(chain_id))
    }

    async fn apply_client_command<Fut, T, E>(
        &self,
        chain_client: &ChainClient,
        mut command: impl FnMut() -> Fut,
    ) -> Result<Result<T, E>, linera_client::Error>
    where
        Fut: Future<Output = Result<ClientOutcome<T>, E>>,
    {
        let result = loop {
            use ClientOutcome::{Committed, WaitForTimeout};
            let timeout = match command().await {
                Ok(Committed(outcome)) => break Ok(Ok(outcome)),
                Ok(WaitForTimeout(timeout)) => timeout,
                Err(e) => break Ok(Err(e)),
            };
            let mut stream = chain_client.subscribe()?;
            linera_client::util::wait_for_next_round(&mut stream, timeout).await;
        };

        self.client_context
            .lock()
            .await
            .update_wallet(chain_client)
            .await?;

        result
    }

    /// Transfers funds from one account to another.
    ///
    /// `options` should be an options object of the form `{ donor,
    /// recipient, amount }`; omitting `donor` will cause the funds to
    /// come from the chain balance.
    ///
    /// # Errors
    /// - if the options object is of the wrong form
    /// - if the transfer fails
    #[wasm_bindgen]
    pub async fn transfer(&self, options: wasm_bindgen::JsValue) -> JsResult<()> {
        let params: TransferParams = serde_wasm_bindgen::from_value(options)?;
        let chain_client = self.default_chain_client().await?;

        let _hash = self
            .apply_client_command(&chain_client, || {
                chain_client.transfer(
                    params.donor.unwrap_or(AccountOwner::CHAIN),
                    linera_base::data_types::Amount::from_tokens(params.amount.into()),
                    params.recipient,
                )
            })
            .await??;

        Ok(())
    }

    /// Gets the balance of the default chain.
    ///
    /// # Errors
    /// If the chain couldn't be established.
    pub async fn balance(&self) -> JsResult<String> {
        Ok(self
            .default_chain_client()
            .await?
            .query_balance()
            .await?
            .to_string())
    }

    /// Gets the identity of the default chain.
    ///
    /// # Errors
    /// If the chain couldn't be established.
    pub async fn identity(&self) -> JsResult<JsValue> {
        Ok(serde_wasm_bindgen::to_value(
            &self.default_chain_client().await?.identity().await?,
        )?)
    }

    /// Gets an object implementing the API for Web frontends.
    #[wasm_bindgen]
    #[must_use]
    pub fn frontend(&self) -> Frontend {
        Frontend(self.clone())
    }
}

// A serializer suitable for serializing responses to JavaScript to be
// sent using `postMessage`.
static RESPONSE_SERIALIZER: serde_wasm_bindgen::Serializer = serde_wasm_bindgen::Serializer::new()
    .serialize_large_number_types_as_bigints(true)
    .serialize_maps_as_objects(true);

#[wasm_bindgen]
pub struct Application {
    client: Client,
    id: ApplicationId,
}

#[wasm_bindgen]
impl Frontend {
    /// Gets the version information of the validators of the current network.
    ///
    /// # Errors
    /// If a validator is unreachable.
    ///
    /// # Panics
    /// If no default chain is set for the current wallet.
    #[wasm_bindgen(js_name = validatorVersionInfo)]
    pub async fn validator_version_info(&self) -> JsResult<JsValue> {
        let mut client_context = self.0.client_context.lock().await;
        let chain_id = client_context
            .wallet()
            .default_chain()
            .expect("No default chain");
        let chain_client = client_context.make_chain_client(chain_id);
        chain_client.synchronize_from_validators().await?;
        let result = chain_client.local_committee().await;
        client_context.update_wallet(&chain_client).await?;
        let committee = result?;
        let node_provider = client_context.make_node_provider();

        let mut validator_versions = HashMap::new();

        for (name, state) in committee.validators() {
            match node_provider
                .make_node(&state.network_address)?
                .get_version_info()
                .await
            {
                Ok(version_info) => {
                    if validator_versions
                        .insert(name, version_info.clone())
                        .is_some()
                    {
                        tracing::warn!("duplicate validator entry for validator {name:?}");
                    }
                }
                Err(e) => {
                    tracing::warn!(
                        "failed to get version information for validator {name:?}:\n{e:?}"
                    );
                }
            }
        }

        Ok(validator_versions.serialize(&RESPONSE_SERIALIZER)?)
    }

    /// Retrieves an application for querying.
    ///
    /// # Errors
    /// If the application ID is invalid.
    #[wasm_bindgen]
    pub async fn application(&self, id: &str) -> JsResult<Application> {
        Ok(Application {
            client: self.0.clone(),
            id: id.parse()?,
        })
    }
}

#[wasm_bindgen]
impl Application {
    /// Performs a query against an application's service.
    ///
    /// # Errors
    /// If the application ID is invalid, the query is incorrect, or
    /// the response isn't valid UTF-8.
    ///
    /// # Panics
    /// On internal protocol errors.
    #[wasm_bindgen]
    // TODO(#14) allow passing bytes here rather than just strings
    // TODO(#15) a lot of this logic is shared with `linera_service::node_service`
    pub async fn query(&self, query: &str) -> JsResult<String> {
        let chain_client = self.client.default_chain_client().await?;

        let linera_execution::QueryOutcome {
            response: linera_execution::QueryResponse::User(response),
            operations,
        } = chain_client
            .query_application(linera_execution::Query::User {
                application_id: self.id,
                bytes: query.as_bytes().to_vec(),
            })
            .await?
        else {
            panic!("system response to user query")
        };

        if !operations.is_empty() {
            let _hash = self
                .client
                .apply_client_command(&chain_client, || {
                    chain_client.execute_operations(operations.clone(), vec![])
                })
                .await??;
        }

        Ok(String::from_utf8(response)?)
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    linera_base::tracing::init();
}
