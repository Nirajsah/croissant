import * as wasm from '@linera/client'

import wasmModuleUrl from '@linera/client/pkg/linera_web_bg.wasm?url'

export class Server {
  private static initialized = false
  private static wasmInstance: typeof wasm | null = null

  private client: wasm.Client | null = null
  private wallet: string | null = null

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
      console.log('🚀 WASM Initialized Successfully')
    } catch (error) {
      console.error('❌ WASM Initialization Failed:', error)
    }
  }

  // Create one instance of Server
  static instance: Server | null = null
  static getInstance() {
    if (!this.instance) {
      this.instance = new Server()
    }
    return this.instance
  }

  async setWallet(wallet: string) {
    if (!Server.initialized || !Server.wasmInstance) {
      throw new Error('WASM not initialized')
    }
    this.wallet = wallet

    console.log('✅ Wallet set successfully', wallet)
  }

  public static async run() {
    await this.init()
    this.getInstance()
  }
}
