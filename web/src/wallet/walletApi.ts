export const walletApi = {
  async setWallet(wallet: string) {
    return await chrome.runtime.sendMessage({
      target: 'wallet',
      type: 'set-wallet',
      wallet,
    })
  },

  async createWallet() {
    return await chrome.runtime.sendMessage({
      target: 'wallet',
      type: 'create-wallet',
    })
  },

  async getWallet() {
    return await chrome.runtime.sendMessage({
      target: 'wallet',
      type: 'get-wallet',
    })
  },

  async sayHello() {
    return await chrome.runtime.sendMessage({
      target: 'wallet',
      type: 'say_hello',
    })
  },

  async createDB(wallet: string) {
    return await chrome.runtime.sendMessage({
      target: 'wallet',
      type: 'create_db',
      wallet,
    })
  },
}
