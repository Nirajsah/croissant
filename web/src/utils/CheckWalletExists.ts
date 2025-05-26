export const checkWalletExists = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('linera_wallet')

    request.onsuccess = () => {
      const db = request.result

      try {
        if (!db.objectStoreNames.contains('wallet')) {
          console.log('Wallet store does not exist.')
          db.close()
          indexedDB.deleteDatabase('linera_wallet')
          resolve(false)
          return
        } else {
          resolve(true)
        }
      } catch (err) {
        console.log('Transaction failed:', err)
        indexedDB.deleteDatabase('linera_wallet')
        resolve(false)
      }
    }

    request.onerror = () => {
      console.error('Failed to open DB')
      indexedDB.deleteDatabase('linera_wallet')
      resolve(false)
    }
  })
}
