import type { Wallet } from '@linera/wasm-client'
import PrivateKeySigner from '@linera/wasm-client/src/signer/PrivateKey'
import type * as wasmType from '@linera/wasm-client'

export class WalletManager {
  private static _instance: WalletManager | null = null
  private wallet: Wallet | null = null
  private signer: PrivateKeySigner | null = null
  private wasmInstance: typeof wasmType | null = null

  constructor() {}

  /** Singleton accessor */
  static get instance(): WalletManager {
    if (!this._instance) {
      this._instance = new WalletManager()
    }
    return this._instance
  }

  /** Called once by the Server to provide WASM instance */
  setWasmInstance(wasmInstance: typeof wasmType) {
    if (this.wasmInstance) {
      return
    }
    this.wasmInstance = wasmInstance
  }

  async setWallet(_wallet: string): Promise<string> {
    if (!this.wasmInstance && !_wallet) {
      throw new Error('Missing wasmInstance or wallet')
    }
    await this.wasmInstance!.Wallet.setJsWallet(_wallet) // let the load() handle setting this.wallet.
    return 'Wallet set successfully'
  }

  /** Initialize the wallet and signer (only once) */
  async create(wallet: Wallet): Promise<void> {
    if (!this.wasmInstance && !wallet) {
      throw new Error('Missing wasmInstance or wallet')
    }

    try {
      const secret = new this.wasmInstance!.Secret()
      const mnemonic = PrivateKeySigner.mnemonic()
      const signer = PrivateKeySigner.fromMnemonic(mnemonic)
      secret.set('mn', mnemonic)

      this.wallet = wallet
      this.signer = signer
    } catch (err) {
      this.cleanup()
      throw err
    }
  }

  async getJsWallet(): Promise<string> {
    try {
      const wallet = await this.wasmInstance!.Wallet.readJsWallet()
      return wallet
    } catch (error) {
      throw new Error('Failed to read wallet')
    }
  }

  async load(): Promise<void> {
    if (!this.wasmInstance) {
      throw new Error('Missing wasmInstance inside wallet load')
    }

    try {
      const wallet = await this.wasmInstance!.Wallet.get()
      const mn = await new this.wasmInstance!.Secret().get('mn')
      const signer = PrivateKeySigner.fromMnemonic(mn)

      this.wallet = wallet!
      this.signer = signer!
    } catch (error) {
      throw new Error('Failed to read wallet')
    }
  }

  async reInitWallet(): Promise<void> {
    try {
      const wallet = await this.wasmInstance!.Wallet.get()
      this.wallet = wallet!
    } catch (error) {
      throw new Error('Failed to read wallet')
    }
  }

  async setDefaultChain(chainId: string): Promise<string> {
    try {
      await this.wallet!.setDefault(chainId)
      // this.cleanup()

      // await this.reInitWallet() // reinitialize wallet after assignment
      return 'Default chain set successfully'
    } catch (error) {
      throw new Error('Failed to set default chain')
    }
  }

  async assign(payload: {
    chainId: string
    timestamp: number
  }): Promise<string> {
    try {
      await this.wallet!.assignChain(
        this.signer!.address(),
        payload.chainId,
        payload.timestamp
      )
      // this.cleanup()

      // await this.reInitWallet() // reinitialize wallet after assignment
      return 'Chain assigned successfully'
    } catch (error) {
      throw new Error('Failed to assign')
    }
  }

  getWallet(): Wallet {
    return this.wallet!
  }

  getSigner(): PrivateKeySigner {
    return this.signer!
  }

  cleanup() {
    try {
      this.wallet?.free()
    } catch {}
    this.wallet = null
  }
}
