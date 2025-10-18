use indexed_db_futures::prelude::*;
use indexed_db_futures::transaction::TransactionMode;
use indexed_db_futures::{
    database::{Database, VersionChangeEvent},
    Build,
};
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

/// Prefix used to namespace all keys stored by the Secret Vault within IndexedDB
const VAULT_PREFIX: &str = "vault:";

fn vault_key(field: &str) -> String {
    format!("{}{}", VAULT_PREFIX, field)
}

/**
 * Secret Vault API (built on IndexedDB helpers above)
 *
 * These helpers namespace keys and reuse `persistent_wallet` to store and retrieve
 * arbitrary `JsValue`s that represent secrets or sensitive data.
 */

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

// Storage trait with WASM-compatible async methods (no Send bound)
// #[async_trait(?Send)]
pub trait WalletStorage {
    /// Read a field from storage by key
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError>;

    /// Write a single field to storage
    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError>;

    /// Batch write multiple fields in a single transaction
    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError>;
}

// Implementation for IndexedDB
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

    async fn get_db(&self) -> Result<Database, JsValue> {
        let store_name = self.store_name.clone();

        Database::open(&self.db_name)
            .with_version(self.version)
            .with_on_upgrade_needed(move |evt: VersionChangeEvent, db: Database| {
                let old_version = evt.old_version() as u32;

                // Only create store if upgrading from version 0
                if old_version == 0 {
                    db.create_object_store(&store_name).build().map_err(|e| {
                        JsValue::from_str(&format!("Failed to create object store: {:?}", e))
                    })?;
                }

                Ok(())
            })
            .await
            .map_err(|e| JsValue::from_str(&format!("Failed to open database: {:?}", e)))
    }
}

// #[async_trait(?Send)]
impl WalletStorage for IndexedDbStorage {
    async fn read_field(&self, key: &str) -> Result<Option<JsValue>, JsError> {
        let db = self
            .get_db()
            .await
            .map_err(|e| JsError::new(&format!("Failed to open DB: {:?}", e)))?;

        let tx = db
            .transaction(&self.store_name)
            .build()
            .map_err(|e| JsError::new(&format!("Failed to create transaction: {:?}", e)))?;

        let store = tx
            .object_store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to get store: {:?}", e)))?;

        let result: Option<JsValue> = store
            .get(&JsValue::from_str(key))
            .primitive()
            .map_err(|e| JsError::new(&format!("Failed to build get request: {:?}", e)))?
            .await
            .map_err(|e| JsError::new(&format!("Failed to read field '{}': {:?}", key, e)))?;

        Ok(result)
    }

    async fn write_field(&self, key: &str, value: JsValue) -> Result<(), JsError> {
        let db = self
            .get_db()
            .await
            .map_err(|e| JsError::new(&format!("Failed to open DB: {:?}", e)))?;

        let tx = db
            .transaction(&self.store_name)
            .with_mode(TransactionMode::Readwrite)
            .build()
            .map_err(|e| JsError::new(&format!("Failed to create transaction: {:?}", e)))?;

        let store = tx
            .object_store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to get store: {:?}", e)))?;

        let _ = store.put(&value).with_key(&JsValue::from_str(key));

        Ok(())
    }

    async fn write_fields(&self, fields: Vec<(String, JsValue)>) -> Result<(), JsError> {
        let db = self
            .get_db()
            .await
            .map_err(|e| JsError::new(&format!("Failed to open DB: {:?}", e)))?;

        let tx = db
            .transaction(&self.store_name)
            .with_mode(TransactionMode::Readwrite)
            .build()
            .map_err(|e| JsError::new(&format!("Failed to create transaction: {:?}", e)))?;

        let store = tx
            .object_store(&self.store_name)
            .map_err(|e| JsError::new(&format!("Failed to get store: {:?}", e)))?;

        // Queue all writes
        for (key, value) in fields {
            let _req = store.put(value).with_key(JsValue::from_str(&key));
        }

        Ok(())
    }
}
