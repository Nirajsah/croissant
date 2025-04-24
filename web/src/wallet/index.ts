import * as wasm from '@linera/client'
import type { Client } from '@linera/client'
import type { Wallet } from '@linera/client'

import wasmModuleUrl from '@linera/client/pkg/linera_web_bg.wasm?url'

export class Server {
  private static initialized = false
  private static wasmInstance: typeof wasm | null = null
  private static subscribers = new Set<chrome.runtime.Port>()
  private static ready: Promise<void> | null = null
  private client: Client | null = null
  private wallet: Wallet | null = null

  static async init() {
    if (this.initialized) return

    try {
      const wasmResponse = await fetch(wasmModuleUrl)
      const wasmBuffer = await wasmResponse.arrayBuffer()
      await wasm.default({
        module_or_path: wasmBuffer,
      })
      this.initialized = true
      this.wasmInstance = wasm

      chrome.runtime.onConnect.addListener((port) => {
        if (port.name !== 'notifications' || 'applications') {
          return
        }

        this.subscribers.add(port)
        port.onDisconnect.addListener((port) => this.subscribers.delete(port))
      })
    } catch (error) {
      console.error('❌ WASM Initialization Failed:', error)
    }
  }

  static async run() {
    if (!this.ready) {
      this.ready = this.init()
    }
    await this.ready
    if (!this.instance) {
      this.instance = new Server()
    }
    return this.instance
  }

  // Create one instance of Server
  static instance: Server | null = null
  static async getInstance(): Promise<Server> {
    return await this.run()
  }

  async setWallet(wallet: string) {
    if (!Server.initialized || !Server.wasmInstance) {
      await Server.run()
    }
    const wasm = Server.wasmInstance!
    const jsWallet = await wasm.Wallet.fromJson(wallet)
    // using this jsWallet a client will be created.
  }

  async getWallet() {
    if (!Server.initialized || !Server.wasmInstance) {
      await Server.run()
    }
    const wasm = Server.wasmInstance!
    const jsWallet = await wasm.Wallet.read()
    // using this jsWallet a client will be created.
    return jsWallet
  }
}
