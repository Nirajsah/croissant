use indexed_db_futures::database::Database;
use js_sys::{global, Reflect};
use wasm_bindgen::{JsError, JsValue};
use indexed_db_futures::prelude::*;
use indexed_db_futures::transaction::TransactionMode;
use web_sys::{IdbFactory};
use base64::prelude::*;

/** 
 * Methods to Encrypt and Decrypt the wallet
*/
fn encrypt_wallet(_wallet: &str, _key: &str) -> Result<String, JsError> {
    // Encrypt the wallet using AES 
    todo!()
}

fn decrypt_wallet(_wallet_hash: &str, _key: &str) -> Result<String, JsError> {
    // Decrypt the wallet using AES 
    todo!()
}
pub fn encrypt_wallet_basic(wallet: &str) -> Result<String, JsError> {
    // Serialize the wallet to bytes
    let wallet_bytes = serde_json::to_vec(&wallet).map_err(|e| JsError::new(&format!("Failed to serialize wallet: {}", e)))?;

    // Encode to Base64 (simple reversible encoding for testing)
    let encoded_wallet = BASE64_STANDARD.encode(wallet_bytes);

    // Return the Base64 encoded string as "encrypted" data
    Ok(encoded_wallet)
}

pub fn decrypt_wallet_basic(encrypted_wallet: &str) -> Result<String, JsError> {
    // Decode the Base64 string back to bytes
    let decoded_bytes = BASE64_STANDARD.decode(encrypted_wallet).map_err(|e| JsError::new(&format!("Failed to decode wallet: {}", e)))?;

    // Deserialize the bytes back to the wallet string
    let wallet: String = serde_json::from_slice(&decoded_bytes).map_err(|e| JsError::new(&format!("Failed to deserialize wallet: {}", e)))?;
    
    // Return the decrypted wallet as a string
    Ok(wallet)
}

/** 
 * Operations on IndexedDB, open a database, create an object store, and perform transactions.
*/
async fn init_db() -> Result<Database, indexed_db_futures::error::OpenDbError> {
    // Open the IndexedDB database with the specified name and version.
    let outer = Database::open("linera_wallet_db")
        .with_version(1u8)
        .with_on_upgrade_needed(|_, db| {
                // Create an object store and await its transaction before inserting data.
                db.create_object_store("wallet")
                  .build()?;
                Ok(())
    })
    .await;

    match outer {
        Ok(db) => {
            Ok(db)
        }
        Err(e) => {
            Err(e)
        }
    }
}

pub enum WalletOperation<'a> {
    Read,
    Write(&'a str)
}

/// Creates and stores wallet in a persistent wallet(indexedDB)
pub async fn persist_wallet(op: WalletOperation<'_>) -> Result<String, JsError> {
    // Open the IndexedDB database.
    let db = init_db().await.map_err(|e| {
        let msg = format!("Failed to open DB: {:?}", e);
        JsError::new(&msg)
    })?;

    // Create a transaction to access the object store.
    let transaction = db.transaction("wallet")
        .with_mode(TransactionMode::Readwrite)
        .build()
        .map_err(|e| JsError::new(&format!("Failed to create transaction: {:?}", e)))?;

    // Get the object store.
    let object_store = transaction.object_store("wallet")
        .map_err(|e| JsError::new(&format!("Failed to get object store: {:?}", e)))?;

    // Clear previous wallet if needed
    let _ = object_store.clear();

    match op {
        WalletOperation::Write(wallet) => {
            // store wallet
            object_store
                .add(wallet)
                .with_key("wallet")
                .primitive()?  
                .await
                .map_err(|e| JsError::new(&format!("Add wallet error: {:?}", e)))?;

            tracing::info!("wallet that has been headed to the database: {:?}", wallet);
            Ok(wallet.to_string())
        }, 
        WalletOperation::Read => {
            todo!()
        }
    }
}


// fn get_indexed_db() -> Result<IdbFactory, JsValue> {
//     let global = global(); // gets `self` in a service worker context
//     let indexed_db = Reflect::get(&global, &JsValue::from_str("indexedDB"))?; // JsValue
//     let indexed_db = indexed_db.dyn_into::<IdbFactory>()?; // IdbFactory
//     Ok(indexed_db)
// }

// pub fn persistent_wallet() {
//     let db: IdbFactory = get_indexed_db().expect("Failed to get indexedDB");
//     let request = db
//         .open("linera_wallet_db")
//         .expect("Failed to open database");

//     // Handle the success and proceed with the transaction
//     request.onsuccess();
//     // Handle the error
//     request.onerror();
// }