import * as wasm from '@linera/wasm-client'
import * as guard from './message.guard'
import { WasmManager } from './wasmManager'
import { ClientManager } from './clientManager'
import { WalletManager } from './walletManager'

type Result<T> = { success: true; data: T } | { success: false; error: string }

type OpType = 'CREATE_WALLET' | 'CLAIM_CHAIN'
type FaucetHandler = (faucet: wasm.Faucet) => Promise<Result<string>>

export type GuardedHandler = [
  (message: any) => message is any, // guard
  (message: any, wrap: (data: any, success?: boolean) => void) => Promise<void>
]

export class Server {
  wasmInstance: typeof wasm | null = null
  private subscribers = new Set<chrome.runtime.Port>()
  private client: ClientManager = ClientManager.instance
  private wallet: WalletManager = WalletManager.instance

  // private isUpdatingWallet = false // IMPORTANT: we need this to make sure we are not processing any incoming message when wallet is in updating state

  constructor() {}

  private safePostMessage(port: chrome.runtime.Port, message: any): boolean {
    try {
      // Check if port is still connected
      if (!port || port.name === undefined) {
        this.subscribers.delete(port)
        return false
      }

      port.postMessage(message)
      return true
    } catch (error) {
      // Port is disconnected, remove from subscribers
      this.subscribers.delete(port)
      return false
    }
  }

  // Helper to broadcast to all subscribers, removing dead ones
  private broadcastToSubscribers(
    message: any,
    filter?: (port: chrome.runtime.Port) => boolean
  ) {
    const deadPorts: chrome.runtime.Port[] = []

    this.subscribers.forEach((port) => {
      // Apply filter if provided
      if (filter && !filter(port)) {
        return
      }

      // Try to send, track failures
      if (!this.safePostMessage(port, message)) {
        deadPorts.push(port)
      }
    })

    // Clean up dead ports
    deadPorts.forEach((port) => this.subscribers.delete(port))
  }

  private extensionHandlers: Record<string, GuardedHandler> = {
    SET_WALLET: [
      guard.isSetWalletRequest,
      async (msg, wrap) => this._handleSetWallet(msg, wrap),
    ],
    GET_WALLET: [
      guard.isGetWalletRequest,
      async (_msg, wrap) => this._handleGetWallet(wrap),
    ],
    CREATE_WALLET: [
      guard.isCreateWalletRequest,
      async (_msg, wrap) => this._handleCreateWallet(wrap),
    ],
    CREATE_CHAIN: [
      guard.isCreateChainRequest,
      async (_msg, wrap) => this._handleCreateChain(wrap),
    ],
    GET_BALANCE: [
      (m): m is any => m.type === 'GET_BALANCE',
      async (_msg, wrap) => this._handleGetBalance(wrap),
    ],
    SET_DEFAULT_CHAIN: [
      (m): m is any => m.type === 'SET_DEFAULT_CHAIN',
      async (msg, wrap) => this._handleSetDefaultChain(msg, wrap),
    ],
    PING: [
      (m): m is any => m.type === 'PING',
      async (_msg, wrap) => this._handlePing(wrap),
    ],
  }

  private applicationHandlers: Record<string, GuardedHandler> = {
    QUERY: [
      guard.isQueryApplicationRequest,
      async (msg, wrap) => this._handleQueryApplicationRequest(msg, wrap),
    ],
    ASSIGNMENT: [
      guard.isAssignmentRequest,
      async (msg, wrap) => this._handleAssignment(msg, wrap),
    ],
  }

  private async dispatchApplicationMessage(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const handlerTuple = this.applicationHandlers[message.type]
    if (!handlerTuple) {
      return wrap(`Unhandled message type: ${message.type}`, false)
    }

    const [guardFn, handler] = handlerTuple
    if (!guardFn(message)) {
      return wrap(`Invalid message structure`, false)
    }

    try {
      await handler(message, wrap)
    } catch (err) {
      wrap(String(err), false)
    }
  }

  private async dispatchExtensionMessage(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const handlerTuple = this.extensionHandlers[message.type]
    if (!handlerTuple) {
      return wrap(`Unhandled message type: ${message.type}`, false)
    }

    const [guardFn, handler] = handlerTuple
    if (!guardFn(message)) {
      return wrap(`Invalid message format for ${message}`, false)
    }

    try {
      await handler(message, wrap)
    } catch (err) {
      wrap(String(err), false)
    }
  }

  private async forwardMessageToServiceWorker(message: any, wrap: any) {
    try {
      await chrome.runtime.sendMessage({ ...message })
    } catch (err) {
      wrap(err, false)
    }
  }

  private async handleApprovalMessage(
    port: chrome.runtime.Port,
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const { status, approvalType } = message.message
    const success = status === 'APPROVED'
    const response = {
      requestId: message.message.requestId,
      success,
      data: '',
    }

    try {
      switch (approvalType) {
        case 'connect_wallet_request':
          response.data = this.wallet.getSigner().address()
          break
        case 'assign_chain_request':
          await this._handleAssignment(message, wrap)
          response.data = 'Assigned'
          break
        default:
          response.data = 'No-op approval'
      }
    } catch (err) {
      response.success = false
      response.data = String(err)
    } finally {
      wrap('Done')
    }

    this.subscribers.forEach(
      (port) => port.name == 'applications' && port.postMessage(response)
    )
  }

  private async routeMessage(
    port: chrome.runtime.Port,
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const { name: portName } = port
    const { type: messageType } = message

    // Handle global types first
    if (['CONNECT_WALLET', 'ASSIGNMENT'].includes(messageType)) {
      return await this.forwardMessageToServiceWorker(message, wrap)
    }

    if (messageType === 'APPROVAL' && portName === 'extension') {
      return await this.handleApprovalMessage(port, message, wrap)
    }

    if (portName === 'extension') {
      return await this.dispatchExtensionMessage(message, wrap)
    }

    if (portName === 'applications') {
      return await this.dispatchApplicationMessage(message, wrap)
    }

    console.warn(`⚠️ Unknown port or message type: ${portName}:${messageType}`)
  }

  private addSubscriber(port: chrome.runtime.Port) {
    if (!this.subscribers.has(port)) {
      this.subscribers.add(port)
    }
  }

  private handlePortDisconnect(port: chrome.runtime.Port) {
    this.subscribers.delete(port)

    if (chrome.runtime.lastError) {
      console.warn('Port disconnect error:', chrome.runtime.lastError.message)
    }
  }

  private setupPortConnections() {
    chrome.runtime.onConnect.addListener((port) => {
      if (!['extension', 'applications'].includes(port.name)) return

      this.addSubscriber(port)

      port.onMessage.addListener(async (message) => {
        if (message.target !== 'wallet') return

        const requestId = message.requestId
        const wrap = (data: any, success = true) => {
          console.log(' message, data', message, data)
          this.safePostMessage(port, { requestId, success, data })
        }
        /* if (this.isUpdatingWallet) {
          wrap('Wallet is updating. Please wait.', false)
          return
        } */
        try {
          await this.routeMessage(port, message, wrap)
        } catch (err) {
          wrap(String(err), false)
        }
      })

      port.onDisconnect.addListener(() => this.handlePortDisconnect(port))
    })
  }

  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      const wallet = await faucet.createWallet()
      this.wallet.create(wallet)

      let chainId = await faucet.claimChain(
        wallet,
        this.wallet.getSigner().address()
      )

      return { success: true, data: chainId }
    },
    CLAIM_CHAIN: async (faucet) => {
      return {
        success: true,
        data: await faucet.claimChain(
          this.wallet.getWallet(),
          this.wallet.getSigner().address()
        ),
      }
    },
  }

  /*
   * Logic for creating a new wallet and claiming a new chain for
   * existing wallet using the faucet,
   * and also to set wallet in indexeddb
   */
  private async faucetAction(op: OpType): Promise<Result<string>> {
    const FAUCET_URL = 'http://localhost:8079'
    // const FAUCET_URL = 'https://faucet.testnet-conway.linera.net/'
    const faucet = new wasm.Faucet(FAUCET_URL)
    const handler = this.faucetHandlers[op]
    if (!handler) return { success: false, error: 'Invalid operation' }
    try {
      const result = await handler.call(this, faucet)
      await this.initClient() // Initialize client after faucet action
      return result
    } catch (err) {
      return { success: false, error: `${err}` }
    }
  }

  // if wallet exists, initialize client, wallet is consumed here, so we renitialize it
  private async initClient() {
    console.log(
      'wallet and signer',
      this.wallet.getWallet(),
      this.wallet.getSigner(),
      this.wasmInstance
    )
    if (!this.wallet.getWallet() || !this.wallet.getSigner()) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 300))

    console.log('reiniting client....')
    try {
      // Initialize a fresh one
      await this.client.init(
        this.wasmInstance!,
        this.wallet.getWallet(),
        this.wallet.getSigner()
      )

      await this.wallet.reInitWallet() // reinitialize wallet after client init

      // Register your message forwarder, need to update this logic better handle notifications type
      this.client.onNotificationCallback = (data: any) => {
        this.broadcastToSubscribers({
          type: 'NOTIFICATION',
          data,
        })
      }
    } catch (error) {
      await this.wallet.reInitWallet() // reinitialize wallet after client init
      console.warn('Failed to initialize client:', error)
      throw error
    }
  }

  private async initWallet() {
    // Inject the wasm instance into your wallet manager
    this.wallet.setWasmInstance(this.wasmInstance!)

    // Now wallet manager can safely load or create wallets
    try {
      await this.wallet.load()
    } catch (err) {
      return // we don't need to return error here
    }
  }

  private async init() {
    await WasmManager.init()
    this.wasmInstance = WasmManager.instance

    this.setupPortConnections()
    await this.initWallet()
    await this.initClient()
  }

  private async _handlePing(wrap: (data: any, success?: boolean) => void) {
    wrap('PONG')
  }

  // WalletManager will handle setWallet logic
  private async _handleSetWallet(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    try {
      const result = await this.wallet.setWallet(message.wallet)
      wrap(result)
    } catch (err) {
      console.error(err)
    }
  }

  private async _handleGetWallet(wrap: (data: any, success?: boolean) => void) {
    try {
      const wallet = await this.wallet.getJsWallet()
      wrap(wallet)
    } catch (err) {
      wrap(`${err}`, false)
    }
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
    try {
      const result = await this.client.getBalance()
      wrap(result)
    } catch (err) {
      wrap(`${err}`, false)
    }
  }

  // TODO: use wallet manager to set default chain
  private async _handleSetDefaultChain(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    // set this to make sure we don't process any message at this time
    // this.isUpdatingWallet = true
    try {
      const result = await this.wallet.setDefaultChain(message.chain_id)
      // reinitialize client after setting default chain
      await this.client.cleanup()
      await this.initClient()
      wrap(result)
    } catch (error) {
      console.error(error)
    } finally {
      // this.isUpdatingWallet = false
    }
  }

  // TODO: use wallet manager to assign chain
  private async _handleAssignment(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    try {
      // set this to make sure we don't process any message at this time
      // this.isUpdatingWallet = true
      const { payload } = message.message

      const result = await this.wallet.assign(payload) // assign chain in wallet manager, this will also reinitialize wallet
      // reinitialize client after assignment
      await this.client.cleanup()
      await this.initClient()
      wrap(result)
    } catch (err) {
      wrap(`${err}`, false)
    } finally {
      // this.isUpdatingWallet = false
    }
  }

  private async _handleQueryApplicationRequest(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    try {
      const result = await this.client.query(message.message)
      wrap(result)
    } catch (err) {
      wrap(err, false)
    }
  }

  public static async run() {
    new Server().init()
  }
}
