use async_trait::async_trait;
use rexie::{ObjectStore, Rexie, TransactionMode};
use wasm_bindgen::{prelude::wasm_bindgen, JsError, JsValue};

// /// UserData will be sent to the wallet client
// #[derive(Clone, Deserialize, Serialize)]
// pub struct UserData {
//     pub chains: BTreeMap<ChainId, UserChain>,
//     pub default_chain: ChainId,
//     /*
//      * 1. Balance needs to sent as well.
//      */
// }

/**
 * Methods to Encrypt and Decrypt the wallet
*/
// These basic encryption/decryption functions are no longer needed
// as we will be storing individual fields directly.
/*
fn _encrypt_wallet(_wallet: &str, _key: &str) -> Result<String, JsError> {
    // Encrypt the wallet using AES
    todo!()
}

fn _decrypt_wallet(_wallet_hash: &str, _key: &str) -> Result<String, JsError> {
    // Decrypt the wallet using AES
    todo!()
}
*/

/**
 * Secret Vault API (built on IndexedDB helpers above)
 *
 * These helpers namespace keys and reuse `persistent_wallet` to store and retrieve
 * arbitrary `JsValue`s that represent secrets or sensitive data.
 */

/// Prefix used to namespace all keys stored by the Secret Vault within IndexedDB
const VAULT_PREFIX: &str = "vault:";

fn vault_key(field: &str) -> String {
    format!("{}{}", VAULT_PREFIX, field)
}

#[wasm_bindgen(js_name = "Secret")]
pub struct SecretVault;

#[wasm_bindgen(js_class = "Secret")]
impl SecretVault {
    /// Creates a new SecretVault instance.
    #[wasm_bindgen(constructor)]
    pub fn new() -> SecretVault {
        SecretVault
    }

    /// Stores a secret value under the provided field name.
    /// Returns a JS Promise that resolves when the value has been written.
    #[wasm_bindgen]
    pub async fn set(&self, field: String, value: JsValue) -> Result<(), JsError> {
        let db = IndexedDbStorage::new("linera_store", "vault", 1);
        db.write_field(&vault_key(&field), value).await
    }

    /// Retrieves a secret value for the provided field name.
    /// Returns `undefined` if the key is not present.
    #[wasm_bindgen]
    pub async fn get(&self, field: String) -> Result<JsValue, JsError> {
        let db = IndexedDbStorage::new("linera_store", "vault", 1);
        match db.read_field(&vault_key(&field)).await {
            Ok(Some(v)) => Ok(v),
            Ok(None) => Ok(JsValue::UNDEFINED),
            Err(e) => Err(e),
        }
    }
}

#[async_trait(?Send)]
pub trait WalletStorage {
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError>;
    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError>;
    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError>;
}

#[derive(Clone)]
pub struct IndexedDbStorage {
    db_name: String,
    store_name: String,
    version: u32,
}

impl IndexedDbStorage {
    pub fn new(db_name: impl Into<String>, store_name: impl Into<String>, version: u32) -> Self {
        Self {
            db_name: db_name.into(),
            store_name: store_name.into(),
            version,
        }
    }

    async fn get_db(&self) -> Result<Rexie, JsError> {
        let db = Rexie::builder(&self.db_name)
            .version(self.version)
            .add_object_store(ObjectStore::new(&self.store_name))
            .build()
            .await
            .map_err(|e| JsError::new(&format!("Failed to open IndexedDB: {:?}", e)))?;
        Ok(db)
    }
}

#[async_trait(?Send)]
impl WalletStorage for IndexedDbStorage {
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError> {
        let db = self.get_db().await?;

        let tx = db
            .transaction(&[&self.store_name], TransactionMode::ReadOnly)
            .map_err(|e| JsError::new(&format!("Failed to start transaction: {:?}", e)))?;
        let store = tx
            .store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to open store: {:?}", e)))?;

        let result = store
            .get(JsValue::from_str(key))
            .await
            .map_err(|e| JsError::new(&format!("Failed to read '{}': {:?}", key, e)))?;

        // Wait for transaction to complete
        tx.done()
            .await
            .map_err(|e| JsError::new(&format!("Transaction failed: {:?}", e)))?;

        Ok(result)
    }

    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError> {
        let db = self.get_db().await?;

        let tx = db
            .transaction(&[&self.store_name], TransactionMode::ReadWrite)
            .map_err(|e| JsError::new(&format!("Failed to start transaction: {:?}", e)))?;
        let store = tx
            .store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to open store: {:?}", e)))?;

        store
            .put(&value, Some(&JsValue::from_str(key)))
            .await
            .map_err(|e| JsError::new(&format!("Failed to put '{}': {:?}", key, e)))?;

        tx.done()
            .await
            .map_err(|e| JsError::new(&format!("Transaction commit failed: {:?}", e)))?;

        Ok(())
    }

    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError> {
        let db = self.get_db().await?;

        let tx = db
            .transaction(&[&self.store_name], TransactionMode::ReadWrite)
            .map_err(|e| JsError::new(&format!("Failed to start transaction: {:?}", e)))?;
        let store = tx
            .store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to open store: {:?}", e)))?;

        let iter = fields.into_iter().map(|(key, value)| {
            let key_js = JsValue::from_str(&key);
            (value, Some(key_js))
        });

        store
            .put_all(iter)
            .await
            .map_err(|e| JsError::new(&format!("Failed to write fields: {:?}", e)))?;

        tx.done()
            .await
            .map_err(|e| JsError::new(&format!("Transaction commit failed: {:?}", e)))?;

        Ok(())
    }
}
