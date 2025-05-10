import * as wasm from '@linera/client'
import type { Client, Wallet } from '@linera/client'

import * as guard from './message.guard'

export class Server {
  private initialized = false
  private wasmInstance: typeof wasm | null = null
  private subscribers = new Set<chrome.runtime.Port>()

  private client: Client | null = null
  private wallet: Wallet | null = null

  constructor() {}

  async setWallet(wallet: string) {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const wasm = this.wasmInstance!
    try {
      const jsWallet = await wasm.Wallet.fromJson(wallet)
      this.wallet = jsWallet
      return 'OK'
    } catch (error) {
      console.error(error)
    }
  }

  async getWallet() {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const wasm = this.wasmInstance!

    try {
      const walletStr = await wasm.Wallet.read()

      return walletStr
    } catch (error) {
      console.error(error)
    }
  }

  async createClient() {
    // Only create a new client if it's not already created
    // // Create the client if not already created
    this.wallet = await wasm.Wallet.read_wallet()
    const client = await new wasm.Client(this.wallet)
    this.client = client

    this.client.onNotification((notification: any) => {
      console.debug(
        'got notification for',
        this.subscribers.size,
        'subscribers:',
        notification
      )
      for (const subscriber of this.subscribers.values()) {
        subscriber.postMessage(notification)
      }
    })
  }

  async init() {
    if (this.initialized) return

    try {
      await (await wasm).default()

      this.initialized = true
      this.wasmInstance = wasm

      console.log('wallet initialized ✅')
    } catch (error) {
      console.error('❌ WASM Initialization Failed:', error)
    }

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== 'applications' && port.name !== 'extension') {
        return
      }

      this.subscribers.add(port)

      port.onMessage.addListener(async (message) => {
        console.log('port', message, port)
        if (message.target !== 'wallet') return false

        const requestId = message.requestId
        const wrap = (data: any, success = true) => {
          port.postMessage({
            requestId,
            success,
            data,
          })
        }

        if (guard.isSetWalletRequest(message)) {
          wrap(await this.setWallet(message.wallet))
        } else if (guard.isGetWalletRequest(message)) {
          wrap(await this.getWallet())
        } else if (guard.isQueryApplicationRequest(message)) {
          // Make sure client is initialized before using it
          if (!this.client) {
            await this.createClient()
          }
          if (!this.client) {
            wrap('Client Error')
            return
          }
          const app = await this.client
            .frontend()
            .application(message.applicationId)

          const result = await app.query(message.query)

          wrap(result)
        } else if (guard.isMutationApplicationRequest(message)) {
        } else {
        }
      })

      port.onDisconnect.addListener((port) => this.subscribers.delete(port))
    })
  }

  public static async run() {
    new Server().init()
  }
}
