let walletPort: chrome.runtime.Port | null = null

function getWalletPort(): chrome.runtime.Port {
  function reconnect() {
    walletPort = chrome.runtime.connect({ name: 'notifications' })
  }
  if (!walletPort) {
    walletPort = chrome.runtime.connect({ name: 'notifications' })

    walletPort.onDisconnect.addListener(() => {
      setTimeout(() => {
        reconnect()
      }, 500)
      walletPort = null
    })
  }
  return walletPort
}

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
    return this.sendMessage({ type: 'GET_WALLET' })
  },

  setWallet(wallet: string) {
    return this.sendMessage({ type: 'SET_WALLET', wallet })
  },

  ping() {
    return this.sendMessage({ type: 'PING' })
  },
}
