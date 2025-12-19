// Copyright (c) Zefchain Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use std::{collections::HashMap, rc::Rc};

use linera_base::identifiers::ChainId;
use linera_client::config::GenesisConfig;
use linera_core::wallet;
use linera_core::wallet::Chain;
use wasm_bindgen::prelude::*;
use web_sys::wasm_bindgen;

use crate::utils::{IndexedDbStorage, WalletStorage};

#[allow(unused_imports)]
use super::JsResult;

#[wasm_bindgen(js_name = "Wallet")]
#[derive(Clone)]
pub struct PersistentWallet {
    pub(crate) wallet: Wallet,
    storage: IndexedDbStorage,
}

impl PersistentWallet {
    pub fn new(wallet: Wallet, storage: IndexedDbStorage) -> Self {
        Self { wallet, storage }
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
        let genesis_val = match genesis_result {
            Some(val) => val,
            None => return Ok(None),
        };

        // Chains: stored as JS Map - use serde_wasm_bindgen directly
        let chains: HashMap<ChainId, Chain> = serde_wasm_bindgen::from_value(chains_val)
            .map_err(|e| JsError::new(&format!("Failed to deserialize chains: {e}")))?;

        // Genesis: stored as JSON string - parse it first
        let genesis_config: GenesisConfig = if let Some(json_str) = genesis_val.as_string() {
            serde_json::from_str(&json_str)
                .map_err(|e| JsError::new(&format!("Failed to deserialize genesis: {e}")))?
        } else {
            serde_wasm_bindgen::from_value(genesis_val)
                .map_err(|e| JsError::new(&format!("Failed to deserialize genesis: {e}")))?
        };

        // Default: stored as plain string (chain ID) or null, only null when wallet is new, no chain exists
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
                serde_wasm_bindgen::from_value(val.clone()).ok()
            }
        } else {
            None
        };

        let mut memory = wallet::Memory::default();
        memory.extend(chains.iter().map(|(id, chain)| (*id, chain.clone())));

        let wallet = Wallet {
            chains: Rc::new(memory),
            default,
            genesis_config,
        };
        let persistent_wallet = PersistentWallet::new(wallet, storage);

        Ok(Some(persistent_wallet))
    }

    /*
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
    } */

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
            let genesis_json = serde_json::to_string(&self.wallet.genesis_config)
                .map_err(|e| JsError::new(&format!("Failed to serialize genesis: {}", e)))?;
            fields.push(("genesis".to_string(), JsValue::from_str(&genesis_json)));
        }
        let result = self.storage.write_fields(fields).await;
        result
    }

    /* #[wasm_bindgen(js_name = assignChain)]
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
    } */

    /* /// Use to update default chain with new chain
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
    } */
}

/// A wallet that stores the user's chains and keys in memory.
#[derive(Clone)]
pub struct Wallet {
    pub(crate) chains: Rc<wallet::Memory>,
    pub(crate) default: Option<ChainId>,
    pub(crate) genesis_config: GenesisConfig,
}

/* impl Wallet {
    /// Set the owner of a chain (the account used to sign blocks on this chain).
    ///
    /// # Errors
    ///
    /// If the provided `ChainId` or `AccountOwner` are in the wrong format.
    #[wasm_bindgen(js_name = setOwner)]
    pub async fn set_owner(&self, chain_id: JsValue, owner: JsValue) -> JsResult<()> {
        let chain_id = serde_wasm_bindgen::from_value(chain_id)?;
        let owner = serde_wasm_bindgen::from_value(owner)?;
        self.chains
            .mutate(chain_id, |chain| chain.owner = Some(owner))
            .ok_or(JsError::new(&format!(
                "chain {chain_id} doesn't exist in wallet"
            )))
    }
} */
