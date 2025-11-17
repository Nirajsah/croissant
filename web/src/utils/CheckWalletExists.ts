export const checkWalletExists = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('linera')

    request.onsuccess = () => {
      const db = request.result

      try {
        // Check if the object store exists
        if (!db.objectStoreNames.contains('ldb')) {
          db.close()
          resolve(false)
          return
        }

        const tx = db.transaction('ldb', 'readonly')
        const store = tx.objectStore('ldb')
        const countReq = store.count()

        countReq.onsuccess = () => {
          const count = countReq.result
          db.close()
          resolve(count > 0)
        }

        countReq.onerror = () => {
          db.close()
          resolve(false)
        }
      } catch (err) {
        db.close()
        resolve(false)
      }
    }

    request.onerror = () => {
      resolve(false)
    }
  })
}
