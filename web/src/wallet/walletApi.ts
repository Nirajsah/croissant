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

  getPendingApprovals() {
    return this.sendMessage<any[]>({ type: 'GET_PENDING_APPROVALS', target })
  },

  getBalance(chainId?: string) {
    return this.sendMessage({ type: 'GET_BALANCE', target, chainId })
  },

  setDefaultChain(chainId: string) {
    return this.sendMessage({ type: 'SET_DEFAULT_CHAIN', chainId, target })
  },

  // Send approval decision to wallet server
  sendConfirmation(message: { status: string; requestId: string; approvalType: string }) {
    return this.sendMessage({
      type: 'resolve_approval_request',
      message: message,
      target,
    })
  },
}
