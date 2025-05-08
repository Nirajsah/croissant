import * as wasm from '@linera/client'
import type { Client, Wallet } from '@linera/client'

import wasmModuleUrl from '@linera/client/pkg/linera_web_bg.wasm?url'
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
    const jsWallet = await wasm.Wallet.fromJson(wallet)

    this.wallet = jsWallet
  }

  async getWallet() {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const wasm = this.wasmInstance!
    const result = await wasm.Wallet.read()

    if (!result) return

    const [walletStr, jsWallet] = result

    this.wallet = jsWallet

    // Only create a new client if it's not already created
    if (this.client) {
      return walletStr
    }

    // Create the client if not already created
    this.client = await new wasm.Client(jsWallet)

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
    return walletStr
  }

  async init() {
    if (this.initialized) return

    try {
      const wasmResponse = await fetch(wasmModuleUrl)
      const wasmBuffer = await wasmResponse.arrayBuffer()
      await wasm.default({
        module_or_path: wasmBuffer,
      })
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
        if (message.target !== 'wallet') return false

        const requestId = message.requestId
        const wrap = (data: any, success = true) => {
          port.postMessage({ requestId, success, data })
        }

        // Ensure client is created before using it
        if (!this.client) {
          await this.getWallet() // Ensure client is initialized
        }

        if (guard.isSetWalletRequest(message)) {
          await this.setWallet(message.wallet)
        } else if (guard.isGetWalletRequest(message)) {
          wrap(await this.getWallet())
        } else if (guard.isQueryApplicationRequest(message)) {
          // Make sure client is initialized before using it
          console.log('client', this.client)
          if (!this.client) {
            await this.getWallet()
          }
          const app = await this.client
            ?.frontend()
            .application(message.applicationId)

          console.log('app', app)
          // const result = await app?.query(message.query)
          // console.log('result of the reached message', result, app, this.client)
          wrap('Hello there')
        } else if (guard.isMutationApplicationRequest(message)) {
        } else {
        }
      })

      port.onDisconnect.addListener((port) => this.subscribers.delete(port))
    })
  }

  public static async run() {
    new Server().init()
    // const server = new Server()
    // if (!server.initialized) {
    //   await server.init()
    // }
  }
}
