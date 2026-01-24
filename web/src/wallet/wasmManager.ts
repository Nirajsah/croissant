import * as wasm from '@linera/wasm-client'

export class WasmManager {
  private static wasm: typeof wasm | null = null
  private static initialized: boolean = false

  private constructor() { }

  static async init(): Promise<void> {
    if (this.initialized && this.wasm) return

    try {
      await wasm.initialize()

      this.wasm = wasm
      this.initialized = true
    } catch (err) {
      console.info('WASM init failed', err)
      throw err
    }
  }

  static get instance(): typeof wasm {
    if (!this.wasm) throw new Error('WASM not initialized')
    return this.wasm
  }
}