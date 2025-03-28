import * as wasm from '@linera/client'
// import type { Client } from '@linera/client';

import wasmModuleUrl from '@linera/client/pkg/linera_web_bg.wasm?url'

export class Server {
  private static initialized = false

  public static async init() {
    if (this.initialized) return

    try {
      const wasmResponse = await fetch(wasmModuleUrl)
      const wasmBuffer = await wasmResponse.arrayBuffer()
      await wasm.default({
        module_or_path: await WebAssembly.instantiate(wasmBuffer),
      })
      this.initialized = true
      console.log('🚀 WASM Initialized Successfully')
    } catch (error) {
      console.error('❌ WASM Initialization Failed:', error)
    }
  }

  public static async run() {
    await this.init()
  }
}
