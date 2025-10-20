use std::clone;

use async_trait::async_trait;
use futures::{future::try_join_all, TryFutureExt};
use rexie::Rexie;
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
// fn get_indexed_db() -> Result<IdbFactory, JsValue> {
//     let global = js_sys::global(); // Gets `self` or `window`, depending on context
//     let indexed_db = Reflect::get(&global, &JsValue::from_str("indexedDB"))?;
//     let idb_factory = indexed_db.dyn_into::<IdbFactory>()?;
//     Ok(idb_factory)
// }

// const STORE_NAME: &str = "wallet";
// const DBNAME: &str = "linera_wallet";

// pub async fn open_db() -> Result<IdbDatabase, JsValue> {
//     let db: IdbFactory = get_indexed_db().expect("Failed to get indexedDB");

//     let request = db
//         .open_with_u32(DBNAME, 2u32) // 2nd version, checking opens version 1
//         .expect("Failed to open database");

//     let on_upgrade = Closure::wrap(Box::new(move |event: web_sys::IdbVersionChangeEvent| {
//         let target: web_sys::IdbOpenDbRequest = event
//             .target()
//             .unwrap()
//             .dyn_into()
//             .expect("Failed to cast target to IdbOpenDbRequest");

//         let db: IdbDatabase = target
//             .result()
//             .unwrap()
//             .dyn_into()
//             .expect("Failed to get DB result");

//         if !db.object_store_names().contains(STORE_NAME) {
//             let _db = db
//                 .create_object_store(STORE_NAME)
//                 .expect("Failed to create object store");

//             web_sys::console::log_1(&_db.into());
//         }
//     }) as Box<dyn FnMut(_)>);
//     request.set_onupgradeneeded(Some(on_upgrade.as_ref().unchecked_ref()));
//     on_upgrade.forget();

//     // Error
//     let onerror = Closure::wrap(Box::new(move |_: web_sys::Event| {
//         web_sys::console::log_1(&"Error opening DB".into());
//     }) as Box<dyn FnMut(_)>);

//     request.set_onerror(Some(onerror.as_ref().unchecked_ref()));
//     onerror.forget();

//     // Wrap onsuccess/.onerror in a future
//     let (sender, receiver) = futures_channel::oneshot::channel::<IdbDatabase>();

//     let onsuccess_cb = Closure::once(Box::new(move |event: web_sys::Event| {
//         let target = event
//             .target()
//             .unwrap()
//             .unchecked_into::<web_sys::IdbOpenDbRequest>();
//         let db = target.result().unwrap().unchecked_into::<IdbDatabase>();
//         let _ = sender.send(db);
//     }) as Box<dyn FnOnce(_)>);

//     request.set_onsuccess(Some(onsuccess_cb.as_ref().unchecked_ref()));
//     onsuccess_cb.forget();

//     // Wait for DB
//     let db: IdbDatabase = receiver
//         .await
//         .map_err(|_| JsValue::from_str("Failed to get Database"))?;
//     Ok(db)
// }

// pub enum DbOperation {
//     ReadField(String),           // New: Field name (key in IndexedDB)
//     WriteField(String, JsValue), // New: Field name (key in IndexedDB) and serialized value
// }

// /// Can read and write from and to db
// // pub async fn persistent_wallet(op: DbOperation) -> Result<Option<String>, JsValue> { // Old signature
// pub async fn persistent_wallet(op: DbOperation) -> Result<Option<JsValue>, JsValue> {
//     // New signature
//     let db = open_db().await?;

//     let tx = db.transaction_with_str_and_mode(STORE_NAME, IdbTransactionMode::Readwrite)?;
//     let store: IdbObjectStore = tx.object_store(STORE_NAME)?;

//     match op {
//         DbOperation::WriteField(key, value) => {
//             // New write operation
//             store.put_with_key(&value, &JsValue::from_str(&key))?;
//             Ok(Some(value))
//         }
//         DbOperation::ReadField(key) => {
//             // New read operation
//             let request = store.get(&JsValue::from_str(&key))?;

//             let (sender, receiver) = futures_channel::oneshot::channel();

//             let onsuccess = Closure::once(Box::new(move |event: web_sys::Event| {
//                 let req = event
//                     .target()
//                     .unwrap()
//                     .unchecked_into::<web_sys::IdbRequest>();
//                 let result = req.result().unwrap();
//                 let _ = sender.send(result);
//             }) as Box<dyn FnOnce(_)>);

//             request.set_onsuccess(Some(onsuccess.as_ref().unchecked_ref()));
//             onsuccess.forget();

//             let result = receiver
//                 .await
//                 .map_err(|e| JsError::new(&format!("Error occurred {:?}", e)))?;
//             if result.is_undefined() {
//                 Ok(None)
//             } else {
//                 Ok(Some(result))
//             }
//         }
//     }
// }

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

/* // Storage trait with WASM-compatible async methods (no Send bound)
#[async_trait(?Send)]
pub trait WalletStorage {
    /// Read a field from storage by key
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError>;

    /// Write a single field to storage
    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError>;

    /// Batch write multiple fields in a single transaction
    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError>;
}

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

    async fn get_db(&self) -> Result<Rexie, RexieError> {
        let db = Rexie::builder(&self.db_name)
            .version(self.version, |db, _old_ver| {
                db.create_object_store(&ObjectStoreBuilder::new(&self.store_name))?;
                Ok(())
            })
            .await?;
        Ok(db)
    }
}

#[async_trait(?Send)]
impl WalletStorage for IndexedDbStorage {
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError> {
        let db = self.get_db().await.map_err(js_err)?;
        let tx = db.transaction(&[&self.store_name]).await.map_err(js_err)?;
        let store = tx.store(&self.store_name).map_err(js_err)?;
        let result = store.get(&JsValue::from_str(key)).await.map_err(js_err)?;
        tx.done().await.map_err(js_err)?;
        Ok(result)
    }

    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError> {
        let db = self.get_db().await.map_err(js_err)?;
        let tx = db.transaction(&[&self.store_name]).await.map_err(js_err)?;
        let store = tx.store(&self.store_name).map_err(js_err)?;
        store
            .put(&value, Some(&JsValue::from_str(key)))
            .await
            .map_err(js_err)?;
        tx.done().await.map_err(js_err)?;
        Ok(())
    }

    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError> {
        let db = self.get_db().await.map_err(js_err)?;
        let tx = db.transaction(&[&self.store_name]).await.map_err(js_err)?;
        let store = tx.store(&self.store_name).map_err(js_err)?;
        for (key, value) in fields {
            store
                .put(&value, Some(&JsValue::from_str(&key)))
                .await
                .map_err(js_err)?;
        }
        tx.done().await.map_err(js_err)?;
        Ok(())
    }
}

// Helper to convert RexieError into your JsError
fn js_err(err: RexieError) -> JsError {
    JsError::new(&format!("IndexedDB error: {:?}", err))
} */

use rexie::{ObjectStore, TransactionMode};
use wasm_bindgen_futures::JsFuture;

#[async_trait(?Send)]
pub trait WalletStorage {
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError>;
    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError>;
    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError>;
}

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

        tracing::info!("getting db: {:?}", db);
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

        tracing::info!("getting db: {:?}", db);

        let tx = db
            .transaction(&[&self.store_name], TransactionMode::ReadWrite)
            .map_err(|e| JsError::new(&format!("Failed to start transaction: {:?}", e)))?;
        let store = tx
            .store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to open store: {:?}", e)))?;

        // Convert your Vec<(String, JsValue)> into an iterator of (JsValue, Option<JsValue>)
        let iter = fields.into_iter().map(|(key, value)| {
            let key_js = JsValue::from_str(&key);
            (value, Some(key_js))
        });

        // Use Rexie’s built-in `put_all`
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

