import * as wasm from '@linera/client'
import type { Client, Wallet } from '@linera/client'
import { PrivateKey } from "@linera/signer"
 
import * as guard from './message.guard'

type Result<T> = { success: true; data: T } | { success: false; error: string }

type OpType = 'CREATE_WALLET' | 'CLAIM_CHAIN'
type FaucetHandler = (faucet: wasm.Faucet) => Promise<Result<string>>

export class Server {
  private initialized = false
  private wasmInstance: typeof wasm | null = null
  private subscribers = new Set<chrome.runtime.Port>()

  private client: Client | null = null
  private wallet: Wallet | null = null

  constructor() {}

  async setDefaultChain(chain_id: string): Promise<Result<string>> {
    await this._ensureClientAndWallet()
    try {
      // this.wallet!.setDefaultChain(await this.client!, chain_id) // TODO!(also need to update the wallet, indexeddb)
      return { success: true, data: `Default chain set to ${chain_id}` }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  async getLocalBalance(): Promise<Result<bigint | undefined>> {
    await this._ensureClientAndWallet()
    try {
      const balance = await this.client?.localBalance()
      return { success: true, data: balance }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  async setWallet(_wallet: string): Promise<Result<string>> {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const _wasm_ = this.wasmInstance!
    try {
      const jsWallet = {} as Wallet
      this.wallet = jsWallet
      return { success: true, data: 'Wallet set successfully' }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  async getWallet(): Promise<Result<string>> {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const _wasm_ = this.wasmInstance!

    try {
      const walletStr = "" // TODO(GetWallet function not implement in client)

      return { success: true, data: walletStr }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  private async _ensureClientAndWallet() {
    if (!this.wallet) {
      // this.wallet = await wasm.Wallet.readJsWallet();
    }
    if (!this.client && this.wallet) {
      this.client = new wasm.Client(this.wallet, new PrivateKey(""));
    }
  }

  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      const wallet = await faucet.createWallet()
      const client = new wasm.Client(wallet, new PrivateKey(""))
      this.client = client
      this.wallet = wallet
      return { success: true, data: await faucet.claimChain(client, "") }
    },

    CLAIM_CHAIN: async (faucet) => {
      await this._ensureClientAndWallet()
      return { success: true, data: await faucet.claimChain(this.client!, "") }
    },
  }

  /*
   * Logic for creating a new wallet or claiming a new chain for
   * existing wallet using the faucet,
   * and also to set wallet in indexeddb
   */
  async faucetAction(op: OpType): Promise<Result<string>> {
    const FAUCET_URL = 'http://localhost:8079'
    const faucet = new wasm.Faucet(FAUCET_URL)
    const handler = this.faucetHandlers[op]
    if (!handler) return { success: false, error: 'Invalid operation' }
    try {
      const result = await handler.call(this, faucet)
      return result
    } catch (err) {
      return { success: false, error: `${err}` }
    }
  }

  async init() {
    if (this.initialized) return
    try {
      await wasm.default()
      this.initialized = true
      this.wasmInstance = wasm
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
          port.postMessage({
            requestId,
            success,
            data,
          })
        }

        type MessageHandler = [(
          message: any
        ) => message is any, (message: any) => Promise<void>]

        const extensionHandlers: Record<string, MessageHandler> = {
          SET_WALLET: [guard.isSetWalletRequest, async (message) => this._handleSetWallet(message, wrap)],
          GET_WALLET: [guard.isGetWalletRequest, async (_message) => this._handleGetWallet(wrap)],
          CREATE_WALLET: [
            guard.isCreateWalletRequest,
            async (_message) => this._handleCreateWallet(wrap),
          ],
          CREATE_CHAIN: [
            guard.isCreateChainRequest,
            async (_message) => this._handleCreateChain(wrap),
          ],
          // GET_BALANCE and SET_DEFAULT_CHAIN do not have explicit guards.
          GET_BALANCE: [(
            message: any
          ): message is any => message.type === 'GET_BALANCE', async (_message) => this._handleGetBalance(wrap)],
          SET_DEFAULT_CHAIN: [(
            message: any
          ): message is any => message.type === 'SET_DEFAULT_CHAIN', async (message) => this._handleSetDefaultChain(message, wrap)],
        }

        const applicationHandlers: Record<string, MessageHandler> = {
          QUERY_APPLICATION: [
            guard.isQueryApplicationRequest,
            async (message) => this._handleQueryApplicationRequest(message, wrap),
          ],
        }

        if (port.name === 'extension') {
          const handlerTuple = extensionHandlers[message.type]
          if (handlerTuple && handlerTuple[0](message)) {
            await handlerTuple[1](message)
          } else if (message.type === 'PING') {
            await this._handlePing(wrap)
          }
        }

        if (port.name === 'applications') {
          const handlerTuple = applicationHandlers[message.type]
          if (handlerTuple && handlerTuple[0](message)) {
            await handlerTuple[1](message)
          }
        }
      })

      port.onDisconnect.addListener((port) => this.subscribers.delete(port))
    })
  }

  private async _handlePing(wrap: (data: any, success?: boolean) => void) {
    wrap('PONG')
  }

  private async _handleSetWallet(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const result = await this.setWallet(message.wallet)
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleGetWallet(wrap: (data: any, success?: boolean) => void) {
    const result = await this.getWallet()
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleCreateWallet(
    wrap: (data: any, success?: boolean) => void
  ) {
    const result = await this.faucetAction('CREATE_WALLET')
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleCreateChain(
    wrap: (data: any, success?: boolean) => void
  ) {
    const result = await this.faucetAction('CLAIM_CHAIN')
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleGetBalance(
    wrap: (data: any, success?: boolean) => void
  ) {
    const result = await this.getLocalBalance()
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleSetDefaultChain(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const result = await this.setDefaultChain(message.chain_id)
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleQueryApplicationRequest(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    await this._ensureClientAndWallet()

    if (!this.client) {
      wrap('Client Error', false)
      return
    }

    try {
      const app = await this.client.frontend().application(message.applicationId)
      const result = await app.query(message.query)
      wrap(result)
    } catch (err) {
      wrap(err, false)
    }
  }

  public static async run() {
    new Server().init()
  }
}
