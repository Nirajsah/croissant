use std::collections::BTreeMap;

use js_sys::Reflect;
use linera_base::identifiers::ChainId;
use linera_client::wallet::UserChain;
use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::Closure, JsCast, JsError, JsValue};
use web_sys::{IdbDatabase, IdbFactory, IdbObjectStore, IdbTransactionMode};

/// UserData will be sent to the wallet client
#[derive(Clone, Deserialize, Serialize)]
pub struct UserData {
    pub chains: BTreeMap<ChainId, UserChain>,
    pub default_chain: ChainId,
    /*
     * 1. Balance needs to sent as well.
     */
}

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

fn get_indexed_db() -> Result<IdbFactory, JsValue> {
    let global = js_sys::global(); // Gets `self` or `window`, depending on context
    let indexed_db = Reflect::get(&global, &JsValue::from_str("indexedDB"))?;
    let idb_factory = indexed_db.dyn_into::<IdbFactory>()?;
    Ok(idb_factory)
}

const STORE_NAME: &str = "wallet";
const DBNAME: &str = "linera_wallet";

pub async fn open_db() -> Result<IdbDatabase, JsValue> {
    let db: IdbFactory = get_indexed_db().expect("Failed to get indexedDB");

    let request = db
        .open_with_u32(DBNAME, 2u32) // 2nd version, checking opens version 1
        .expect("Failed to open database");

    let on_upgrade = Closure::wrap(Box::new(move |event: web_sys::IdbVersionChangeEvent| {
        let target: web_sys::IdbOpenDbRequest = event
            .target()
            .unwrap()
            .dyn_into()
            .expect("Failed to cast target to IdbOpenDbRequest");

        let db: IdbDatabase = target
            .result()
            .unwrap()
            .dyn_into()
            .expect("Failed to get DB result");

        if !db.object_store_names().contains(STORE_NAME) {
            let _db = db
                .create_object_store(STORE_NAME)
                .expect("Failed to create object store");

            web_sys::console::log_1(&_db.into());
        }
    }) as Box<dyn FnMut(_)>);
    request.set_onupgradeneeded(Some(on_upgrade.as_ref().unchecked_ref()));
    on_upgrade.forget();

    // Error
    let onerror = Closure::wrap(Box::new(move |_: web_sys::Event| {
        web_sys::console::log_1(&"Error opening DB".into());
    }) as Box<dyn FnMut(_)>);

    request.set_onerror(Some(onerror.as_ref().unchecked_ref()));
    onerror.forget();

    // Wrap onsuccess/.onerror in a future
    let (sender, receiver) = futures_channel::oneshot::channel::<IdbDatabase>();

    let onsuccess_cb = Closure::once(Box::new(move |event: web_sys::Event| {
        let target = event
            .target()
            .unwrap()
            .unchecked_into::<web_sys::IdbOpenDbRequest>();
        let db = target.result().unwrap().unchecked_into::<IdbDatabase>();
        let _ = sender.send(db);
    }) as Box<dyn FnOnce(_)>);

    request.set_onsuccess(Some(onsuccess_cb.as_ref().unchecked_ref()));
    onsuccess_cb.forget();

    // Wait for DB
    let db: IdbDatabase = receiver
        .await
        .map_err(|_| JsValue::from_str("Failed to get Database"))?;
    Ok(db)
}

pub enum DbOperation {
    // Read(String),          // Old: Key
    // Write(String, String), // Old: Key and value
    ReadField(String),           // New: Field name (key in IndexedDB)
    WriteField(String, JsValue), // New: Field name (key in IndexedDB) and serialized value
}

/// Can read and write from and to db
// pub async fn persistent_wallet(op: DbOperation) -> Result<Option<String>, JsValue> { // Old signature
pub async fn persistent_wallet(op: DbOperation) -> Result<Option<JsValue>, JsValue> {
    // New signature
    let db = open_db().await?;

    let tx = db.transaction_with_str_and_mode(STORE_NAME, IdbTransactionMode::Readwrite)?;
    let store: IdbObjectStore = tx.object_store(STORE_NAME)?;

    match op {
        DbOperation::WriteField(key, value) => {
            // New write operation
            store.put_with_key(&value, &JsValue::from_str(&key))?;
            Ok(Some(value))
        }
        DbOperation::ReadField(key) => {
            // New read operation
            let request = store.get(&JsValue::from_str(&key))?;

            let (sender, receiver) = futures_channel::oneshot::channel();

            let onsuccess = Closure::once(Box::new(move |event: web_sys::Event| {
                let req = event
                    .target()
                    .unwrap()
                    .unchecked_into::<web_sys::IdbRequest>();
                let result = req.result().unwrap();
                let _ = sender.send(result);
            }) as Box<dyn FnOnce(_)>);

            request.set_onsuccess(Some(onsuccess.as_ref().unchecked_ref()));
            onsuccess.forget();

            let result = receiver
                .await
                .map_err(|e| JsError::new(&format!("Error occurred {:?}", e)))?;
            if result.is_undefined() {
                Ok(None)
            } else {
                Ok(Some(result))
            }
        }
    }
}
