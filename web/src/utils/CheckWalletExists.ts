export const checkWalletExists = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('linera')

    request.onsuccess = () => {
      const db = request.result

      try {
        if (!db.objectStoreNames.contains('ldb')) {
          console.log('Wallet store does not exist.')
          db.close()
          indexedDB.deleteDatabase('linera')
          resolve(false)
          return
        } else {
          resolve(true)
        }
      } catch (err) {
        console.log('Transaction failed:', err)
        indexedDB.deleteDatabase('linera')
        resolve(false)
      }
    }

    request.onerror = () => {
      console.error('Failed to open DB')
      indexedDB.deleteDatabase('linera')
      resolve(false)
    }
  })
}
