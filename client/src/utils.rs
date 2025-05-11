use base64::prelude::*;
use js_sys::Reflect;
use wasm_bindgen::{prelude::Closure, JsCast, JsError, JsValue};
use web_sys::{IdbDatabase, IdbFactory, IdbObjectStore, IdbTransactionMode};

/**
 * Methods to Encrypt and Decrypt the wallet
*/
fn _encrypt_wallet(_wallet: &str, _key: &str) -> Result<String, JsError> {
    // Encrypt the wallet using AES
    todo!()
}

fn _decrypt_wallet(_wallet_hash: &str, _key: &str) -> Result<String, JsError> {
    // Decrypt the wallet using AES
    todo!()
}
pub fn encrypt_wallet_basic(wallet: &str) -> Result<String, JsError> {
    // Serialize the wallet to bytes
    let wallet_bytes = serde_json::to_vec(&wallet)
        .map_err(|e| JsError::new(&format!("Failed to serialize wallet: {}", e)))?;

    // Encode to Base64 (simple reversible encoding for testing)
    let encoded_wallet = BASE64_STANDARD.encode(wallet_bytes);

    // Return the Base64 encoded string as "encrypted" data
    Ok(encoded_wallet)
}

pub fn decrypt_wallet_basic(encrypted_wallet: &str) -> Result<String, JsError> {
    // Decode the Base64 string back to bytes
    let decoded_bytes = BASE64_STANDARD
        .decode(encrypted_wallet)
        .map_err(|e| JsError::new(&format!("Failed to decode wallet: {}", e)))?;

    // Deserialize the bytes back to the wallet string
    let wallet: String = serde_json::from_slice(&decoded_bytes)
        .map_err(|e| JsError::new(&format!("Failed to deserialize wallet: {}", e)))?;

    // Return the decrypted wallet as a string
    Ok(wallet)
}

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
    Read(String),          // Key
    Write(String, String), // Key and value
}

/// Can read and write from and to db
pub async fn persistent_wallet(op: DbOperation) -> Result<Option<String>, JsValue> {
    let db = open_db().await?;

    let tx = db.transaction_with_str_and_mode(STORE_NAME, IdbTransactionMode::Readwrite)?;
    let store: IdbObjectStore = tx.object_store(STORE_NAME)?;

    match op {
        DbOperation::Write(_key, value) => {
            store.put_with_key(&JsValue::from_str(&value), &JsValue::from_str(STORE_NAME))?;
            Ok(Some(value))
        }
        DbOperation::Read(_key) => {
            let request = store.get(&JsValue::from_str(STORE_NAME))?;

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
            let result: String = result
                .as_string()
                .ok_or_else(|| JsError::new("Failed to convert JsValue to String"))?;
            Ok(Some(result))
        }
    }
}
