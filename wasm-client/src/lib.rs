// Copyright (c) Zefchain Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/*!
# `linera-web`

This module defines the JavaScript bindings to the client API.

It is compiled to Wasm, with a JavaScript wrapper to inject its imports, and published on
NPM as `@linera/client`.

The `signer` subdirectory contains a TypeScript interface specifying the types of objects
that can be passed as signers — cryptographic integrations used to sign transactions, as
well as a demo implementation (not recommended for production use) that stores a private
key directly in memory and uses it to sign.
*/

// We sometimes need functions in this module to be async in order to
// ensure the generated code will return a `Promise`.
#![allow(clippy::unused_async)]
#![recursion_limit = "256"]

use std::{rc::Rc, sync::Arc};

use futures::{future::FutureExt as _, lock::Mutex as AsyncMutex};
use linera_base::identifiers::{AccountOwner, ChainId};
use linera_client::chain_listener::{ChainListener, ClientContext as _};
use linera_core::JoinSetExt;
use wallet::PersistentWallet;
use wasm_bindgen::prelude::*;
use web_sys::wasm_bindgen;

pub mod chain;
pub mod utils;
pub use chain::Chain;
pub mod faucet;

pub mod signer;
pub use signer::Signer;
pub mod storage;
pub use storage::Storage;
pub mod wallet;

pub type Network = linera_rpc::node_provider::NodeProvider;
pub type Environment =
    linera_core::environment::Impl<Storage, Network, Signer, Rc<linera_core::wallet::Memory>>;
type JsResult<T> = Result<T, JsError>;

/// The full client API, exposed to the wallet implementation. Calls
/// to this API can be trusted to have originated from the user's
/// request.
#[wasm_bindgen]
#[derive(Clone)]
pub struct Client {
    // This use of `futures::lock::Mutex` is safe because we only
    // expose concurrency to the browser, which must always run all
    // futures on the global task queue.
    // It does nothing here in this single-threaded context, but is
    // hard-coded by `ChainListener`.
    client_context: Arc<AsyncMutex<linera_client::ClientContext<Environment>>>,
    persistent: PersistentWallet,
}

#[wasm_bindgen]
impl Client {
    /// Creates a new client and connects to the network.
    ///
    /// # Errors
    /// On transport or protocol error, if persistent storage is
    /// unavailable, or if `options` is incorrectly structured.
    #[wasm_bindgen(constructor)]
    pub async fn new(
        w: &PersistentWallet,
        signer: Signer,
        options: Option<linera_client::Options>,
    ) -> Result<Client, JsError> {
        let options = options.unwrap_or_default();

        let mut storage = storage::get_storage().await?;
        w.wallet
            .genesis_config
            .initialize_storage(&mut storage)
            .await?;

        let client = linera_client::ClientContext::new(
            storage.clone(),
            w.wallet.chains.clone(),
            signer,
            &options,
            w.wallet.default,
            w.wallet.genesis_config.clone(),
        )
        .await?;

        // The `Arc` here is useless, but it is required by the `ChainListener` API.
        #[expect(clippy::arc_with_non_send_sync)]
        let client = Arc::new(AsyncMutex::new(client));
        let client_clone = client.clone();
        let chain_listener = ChainListener::new(
            options.chain_listener_config,
            client_clone,
            storage,
            tokio_util::sync::CancellationToken::new(),
            tokio::sync::mpsc::unbounded_channel().1,
            true,
        )
        .run() // Enable background sync
        .boxed_local()
        .await?
        .boxed_local();

        wasm_bindgen_futures::spawn_local(
            async move {
                if let Err(error) = chain_listener.await {
                    tracing::error!("ChainListener error: {error:?}");
                }
            }
            .boxed_local(),
        );
        log::info!("Linera Web client successfully initialized");

        Ok(Client {
            client_context: client,
            persistent: w.clone(),
        })
    }

    /// Assigns a new chain and returns the ChainClient for use
    #[wasm_bindgen(js_name = "assignChain")]
    pub async fn assign_and_use(&self, chain_id: ChainId, owner: AccountOwner) -> JsResult<Chain> {
        let mut ctx = self.client_context.lock().await;
        ctx.assign_new_chain_to_key(chain_id, owner).await?;

        if !ctx.wallet().chain_ids().contains(&chain_id) {
            ctx.assign_new_chain_to_key(chain_id, owner).await?;
        }

        let chain_client = ctx.make_chain_client(chain_id).await?;

        let (listener, _listnen_handle, _) = chain_client.listen().await?;

        ctx.chain_listeners.spawn_task(listener);
        chain_client.synchronize_from_validators().await?;

        self.persistent.save_to_storage(false).await?;

        drop(ctx);

        Ok(Chain {
            chain_client,
            client: self.clone(),
        })
    }

    /// Connect to a chain on the Linera network.
    /// If no chain is provided, Default chain is used
    /// # Errors
    ///
    /// If the wallet could not be read or chain synchronization fails.
    #[wasm_bindgen]
    pub async fn chain(&self, chain: Option<ChainId>) -> JsResult<Chain> {
        let mut ctx = self.client_context.lock().await;
        let chain_id = chain.unwrap_or_else(|| ctx.default_chain());
        let chain_client = ctx.make_chain_client(chain_id).await?;

        chain_client.synchronize_from_validators().await?;
        ctx.update_wallet(&chain_client).await?;

        self.persistent.save_to_storage(false).await?;
        drop(ctx);

        let chain = Chain {
            chain_client,
            client: self.clone(),
        };
        Ok(chain)
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    use tracing_subscriber::{
        prelude::__tracing_subscriber_SubscriberExt as _, util::SubscriberInitExt as _,
    };

    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .with_ansi(false)
                .without_time()
                .with_writer(tracing_web::MakeWebConsoleWriter::new()),
        )
        .with(
            tracing_web::performance_layer()
                .with_details_from_fields(tracing_subscriber::fmt::format::Pretty::default()),
        )
        .init();
}
