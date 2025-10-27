import * as offscreen from './offscreen/offscreen.ts'

// Lifecycle management - setup offscreen when service worker starts
chrome.runtime.onStartup.addListener(offscreen.setupOffscreenDocument)

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    const keyExists = await doesWalletKeyExist()

    if (!keyExists) {
      console.warn('Wallet not initialized — rejecting request')

      sendResponse({
        success: false,
        error: 'Wallet not initialized. Please set up your wallet first.',
      })
      return
    }

    if (message.type === 'CONNECT_WALLET') {
      const windowId = (await chrome.windows.getCurrent()).id
      if (windowId === undefined) return
      await chrome.action.openPopup({ windowId })
      connectWallet(message.payload, message.requestId)
    } else if (message.type === 'ASSIGNMENT') {
      const windowId = (await chrome.windows.getCurrent()).id
      if (windowId === undefined) return
      await chrome.action.openPopup({ windowId })
      assignChain(message.message, message.payload, message.requestId)
    }
  } catch (err) {
    console.error('Error handling message:', err)
    sendResponse({
      success: false,
      error: 'Unexpected error while processing request',
    })
  }

  return true
})

const connectWallet = (messagePayload: any, requestId: string) => {
  const wc_connect_data: WalletConnectData = {
    type: 'connect_wallet_request',
    requestId: requestId,
    payload: {
      origin: messagePayload.origin,
      href: messagePayload.href,
      title: messagePayload.title,
      favicon: messagePayload.favicon,
    },
    permissions: ['readPublicKey', 'requestSignatures'],
    metaData: {
      method: 'wc_sessionRequest',
    },
  }
  sendMessageToPopup(wc_connect_data)
}

const assignChain = (message: any, payload: any, requestId: string) => {
  const wc_assign_data: AssignChainData = {
    type: 'assign_chain_request',
    requestId: requestId,
    payload: {
      origin: payload.origin,
      href: payload.href,
      title: payload.title,
      favicon: payload.favicon,
    },
    permissions: ['chainAssignment', 'walletMutation'],
    metaData: {
      method: 'wc_assignChainRequest',
      chainId: message.chainId,
      timestamp: message.timestamp,
    },
  }
  sendMessageToPopup(wc_assign_data)
}

const sendMessageToPopup = (payload: WalletConnectData | AssignChainData) => {
  chrome.runtime.sendMessage({
    type: 'OPEN_APPROVAL_POPUP',
    payload,
  })
}

type WalletConnectData = {
  type: string
  requestId: string
  payload: {
    origin: string
    href: string
    title: string
    favicon: string | undefined
  }
  permissions: string[]
  metaData: {
    method: string
    chainId?: string
    timestamp?: string
  }
}

type AssignChainData = {
  type: string
  requestId: string
  payload: {
    origin: string
    href: string
    title: string
    favicon: string | undefined
  }
  permissions: string[]
  metaData: {
    method: string
    chainId: string
    timestamp: string
  }
}

async function doesWalletKeyExist(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('linera_store', 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('vault')) {
        db.createObjectStore('vault')
      }
    }

    request.onerror = () => {
      console.error('Failed to open database:', request.error)
      reject(request.error)
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('vault')) {
        db.close()
        deleteDatabase().then(() => resolve(false))
        return
      }

      const tx = db.transaction('vault', 'readonly')
      const store = tx.objectStore('vault')
      const getRequest = store.get('vault:mn')

      getRequest.onsuccess = () => {
        const hasKey = !!getRequest.result
        db.close()

        if (!hasKey) {
          console.log('Wallet key not found, deleting database')
          deleteDatabase().then(() => resolve(false))
        } else {
          console.log('Wallet key exists, keeping database')
          resolve(true)
        }
      }

      getRequest.onerror = () => {
        console.error('Failed to get key:', getRequest.error)
        db.close()
        deleteDatabase().then(() => resolve(false))
      }
    }
  })

  function deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase('linera_store')

      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully')
        resolve()
      }

      deleteRequest.onerror = () => {
        console.error('Failed to delete database:', deleteRequest.error)
        resolve() // Still resolve to not block
      }

      deleteRequest.onblocked = () => {
        console.warn('Database deletion blocked')
        resolve() // Still resolve to not block
      }
    })
  }
}
