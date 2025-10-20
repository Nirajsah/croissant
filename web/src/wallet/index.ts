import * as wasm from '@linera/wasm-client'
import type { Client, Wallet } from '@linera/wasm-client'
import PrivateKeySigner from '@linera/wasm-client/src/signer/PrivateKey'

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
  private js_wallet: any | null = null
  private signer: PrivateKeySigner | null = null
  constructor() {}

  private async setDefaultChain(chain_id: string): Promise<Result<string>> {
    await this._ensureClientAndWallet()
    try {
      // this.wallet!.setDefaultChain(await this.client!, chain_id) // TODO!(also need to update the wallet, indexeddb)
      return { success: true, data: `Default chain set to ${chain_id}` }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  // private async getLocalBalance(): Promise<Result<bigint | undefined>> {
  //   await this._ensureClientAndWallet()
  //   try {
  //     const balance = await this.client?.localBalance()
  //     return { success: true, data: balance }
  //   } catch (error) {
  //     console.error(error)
  //     return { success: false, error: `${error}` }
  //   }
  // }

  private async setWallet(_wallet: string): Promise<Result<string>> {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    try {
      // const wallet = await this.wasmInstance!.Wallet.setJsWallet(_wallet)
      // this.wallet = {}
      this.js_wallet = _wallet
      return { success: true, data: 'Wallet set successfully' }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  private async getWallet(): Promise<Result<string>> {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    try {
      const wallet = await this.wasmInstance!.Wallet.readJsWallet()
      return { success: true, data: wallet || 'No wallet data' }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  // Need to get mnemonic from secret and use to create the Signer
  private async _initClient() {
    if (this.wallet) {
      // const mn = await new this.wasmInstance!.Secret().get('mn')
      // const signer = PrivateKeySigner.fromMnemonic(mn);
      // this.signer = signer
      // this.client = new wasm.Client(this.wallet, signer, false);
    }
  }

  private async _ensureClientAndWallet() {
    // TODO(Initialise the wallet if not present)
    if (!this.wallet) {
      return { success: false, error: 'wallet not set' }
    }
    if (!this.client && this.wallet) {
      await this._initClient()
    }
  }

  /*
   * CREATE_WALLET method creates a wallet using the faucet,
   * CLAIM_CHAIN method claims a chain from the faucet,
   * It returns the claimed chain_id
   *
   * 1. Wallet is requried to claim a chain.
   * 2. Owner hash is required, will be used to claim the chain.
   */
  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      const wallet = await faucet.createWallet()
      this.wallet = wallet

      const vault = new this.wasmInstance!.Secret()
      const mnemonic = PrivateKeySigner.mnemonic() // this needs to be shown to the user.
      vault.set('mn', mnemonic)
      const signer = PrivateKeySigner.fromMnemonic(mnemonic)
      this.signer = signer
      let chainId = await faucet.claimChain(wallet, signer.address())

      return { success: true, data: chainId }
    },
    CLAIM_CHAIN: async (faucet) => {
      await this._ensureClientAndWallet()
      return {
        success: true,
        data: await faucet.claimChain(this.wallet!, this.signer?.address()),
      }
    },
  }

  /*
   * Logic for creating a new wallet and claiming a new chain for
   * existing wallet using the faucet,
   * and also to set wallet in indexeddb
   */
  private async faucetAction(op: OpType): Promise<Result<string>> {
    console.log('called to createWallet')
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

  private async init() {
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

        type MessageHandler = [
          (message: any) => message is any,
          (message: any) => Promise<void>
        ]

        const extensionHandlers: Record<string, MessageHandler> = {
          SET_WALLET: [
            guard.isSetWalletRequest,
            async (message) => this._handleSetWallet(message, wrap),
          ],
          GET_WALLET: [
            guard.isGetWalletRequest,
            async (_message) => this._handleGetWallet(wrap),
          ],
          CREATE_WALLET: [
            guard.isCreateWalletRequest,
            async (_message) => this._handleCreateWallet(wrap),
          ],
          CREATE_CHAIN: [
            guard.isCreateChainRequest,
            async (_message) => this._handleCreateChain(wrap),
          ],
          // GET_BALANCE and SET_DEFAULT_CHAIN do not have explicit guards.
          GET_BALANCE: [
            (message: any): message is any => message.type === 'GET_BALANCE',
            async (_message) => this._handleGetBalance(wrap),
          ],
          SET_DEFAULT_CHAIN: [
            (message: any): message is any =>
              message.type === 'SET_DEFAULT_CHAIN',
            async (message) => this._handleSetDefaultChain(message, wrap),
          ],
        }

        const applicationHandlers: Record<string, MessageHandler> = {
          QUERY_APPLICATION: [
            guard.isQueryApplicationRequest,
            async (message) =>
              this._handleQueryApplicationRequest(message, wrap),
          ],
          TEMP_CHAIN: [
            guard.isTempChainRequest,
            async (message) => this._handleTempChain(message, wrap),
          ],
          // Will be removed
          MUTATION: [
            guard.isMutationApplicationRequest,
            async (message) =>
              this._handleMutationApplicationRequest(message, wrap),
          ],
          TRANSACTION_CONFIRMATION: [
            guard.isTransactionConfirmationRequest,
            async (message) =>
              this._handleTransactionConfirmationRequest(message, wrap),
          ],
        }

        if (port.name === 'extension') {
          console.log('new message received for', port)
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
    // const result = await this.getLocalBalance()
    // wrap(result.success ? result.data : result.error, result.success)
    wrap('Balance not implemented', false)
  }

  private async _handleSetDefaultChain(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const result = await this.setDefaultChain(message.chain_id)
    wrap(result.success ? result.data : result.error, result.success)
  }

  private async _handleTempChain(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    await this._ensureClientAndWallet()

    if (!this.client) {
      wrap('Client Error', false)
      return
    }
    // Need to put this inside the query
    // const owner = this.signer?.address()

    try {
      const app = await this.client
        .frontend()
        .application(message.applicationId)
      const result = await app.query(message.query)
      wrap(result)
    } catch (err) {
      wrap(err, false)
    }
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
      const app = await this.client
        .frontend()
        .application(message.applicationId)
      const result = await app.query(message.query)
      wrap(result)
    } catch (err) {
      wrap(err, false)
    }
  }

  private async _handleMutationApplicationRequest(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    await this._ensureClientAndWallet()

    if (!this.client) {
      wrap('Client Error', false)
      return
    }

    try {
      // Request transaction confirmation from user
      const requestId = Math.random().toString(36).slice(2)
      const transactionData = {
        from: this.js_wallet?.chains[0]?.owner || 'Unknown',
        to: message.applicationId,
        amount: 'Unknown', // This would need to be extracted from the mutation
        type: 'MUTATION',
        applicationId: message.applicationId,
        mutation: message.mutation,
      }

      // Send confirmation request to background script
      const confirmationResponse = await chrome.runtime.sendMessage({
        type: 'TRANSACTION_CONFIRMATION_REQUEST',
        requestId: requestId,
        transactionData: transactionData,
      })

      if (!confirmationResponse.approved) {
        wrap('Transaction rejected by user', false)
        return
      }

      // Execute the mutation after confirmation
      const app = await this.client!.frontend().application(
        message.applicationId
      )
      // Note: The actual mutation method may need to be implemented based on the Linera client API
      const result = await (app as any).mutation(message.mutation)
      wrap(result)
    } catch (err) {
      wrap(err, false)
    }
  }

  private async _handleTransactionConfirmationRequest(
    _message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    // This handler is mainly for completeness - the actual confirmation
    // is handled by the background script and popup
    wrap('Transaction confirmation handled by popup', true)
  }

  public static async run() {
    new Server().init()
  }
}
