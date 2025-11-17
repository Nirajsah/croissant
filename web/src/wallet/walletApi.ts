let walletPort: chrome.runtime.Port | null = null

function openWalletPort(): chrome.runtime.Port {
  const port = chrome.runtime.connect({ name: 'extension' })
  port.onDisconnect.addListener(() => {
    walletPort = null // Mark the current port as dead so next call creates a new one
  })
  return port
}

function getWalletPort(): chrome.runtime.Port {
  if (!walletPort) {
    walletPort = openWalletPort()
  }
  return walletPort
}

const target = 'wallet'

export const walletApi = {
  sendMessage<T = any>(msg: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const port = getWalletPort()
      const requestId = Date.now().toString()
      msg.requestId = requestId

      function handleResponse(response: any) {
        if (response.requestId !== requestId) return
        port.onMessage.removeListener(handleResponse)
        if (response.success) {
          resolve(response.data)
        } else {
          reject(response.error)
        }
      }

      port.onMessage.addListener(handleResponse)
      port.postMessage(msg)
    })
  },

  getWallet() {
    return this.sendMessage({ type: 'GET_WALLET', target })
  },

  setWallet(wallet: string) {
    return this.sendMessage({ type: 'SET_WALLET', wallet, target })
  },

  ping() {
    return this.sendMessage({ type: 'PING', target })
  },

  createWallet() {
    return this.sendMessage({ type: 'CREATE_WALLET', target })
  },

  createChain() {
    return this.sendMessage({ type: 'CREATE_CHAIN', target })
  },

  getBalances() {
    return this.sendMessage({ type: 'GET_BALANCE', target })
  },

  setDefaultChain(chain_id: string) {
    return this.sendMessage({ type: 'SET_DEFAULT_CHAIN', chain_id, target })
  },

  // use to send confirmation messages to the wallet
  sendConfirmation(message: any) {
    return this.sendMessage({
      type: 'APPROVAL',
      message: message,
      target,
    })
  },
}
