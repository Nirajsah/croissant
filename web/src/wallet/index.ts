import * as wasm from '@linera/wasm-client'
import * as guard from './message.guard'
import { WasmManager } from './wasmManager'
import { ClientManager } from './clientManager'
import { WalletManager } from './walletManager'
import { ApprovalManager, type SensitiveAction } from './approvalManager'

type Result<T> = { success: true; data: T } | { success: false; error: string }

type OpType = 'CREATE_WALLET' | 'CLAIM_CHAIN'
type FaucetHandler = (faucet: wasm.Faucet) => Promise<Result<string>>

export type GuardedHandler = [
  (message: any) => message is any, // guard
  (message: any, wrap: (data: any, success?: boolean) => void) => Promise<void>,
]

export class Server {
  wasmInstance: typeof wasm | null = null
  private subscribers = new Set<chrome.runtime.Port>()
  private client: ClientManager = ClientManager.instance
  private wallet: WalletManager = WalletManager.instance

  // Readiness State
  private isReady = false
  private messageQueue: Array<{
    port: chrome.runtime.Port
    message: any
    wrap: (data: any, success?: boolean) => void
  }> = []

  // Approval Manager (secure)
  private approvalManager = new ApprovalManager()

  constructor() { }

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
    // SECURITY: Application messages require wallet to be initialized
    if (!this.wallet.isWalletInitialized()) {
      return wrap('Wallet not initialized. Please create or import a wallet first.', false)
    }

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

  private async requestApproval(
    type: SensitiveAction,
    origin: string,
    title: string,
    favicon: string,
    href: string,
    params: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    // Create secure approval request with origin tracking
    const requestId = this.approvalManager.createRequest(
      type,
      origin,
      title,
      favicon,
      href,
      params,
      wrap
    )

    // Signal Background to open popup (minimal data)
    try {
      await chrome.runtime.sendMessage({ type: 'OPEN_APPROVAL_POPUP' })
    } catch (err) {
      console.warn('Failed to signal popup open:', err)
    }

    // Also broadcast to already-open extension UIs
    this.broadcastToSubscribers(
      {
        type: 'APPROVAL_REQUEST',
        requestId,
        approvalType: type,
      },
      (port) => port.name === 'extension'
    )
  }

  private async handleApprovalMessage(
    port: chrome.runtime.Port,
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    // SECURITY: Only accept from extension port
    if (port.name !== 'extension') {
      return wrap('Unauthorized: approval only from extension', false)
    }
    // SECURITY: Wallet must be initialized to resolve approvals
    if (!this.wallet.isWalletInitialized()) {
      return wrap('Wallet not initialized', false)
    }

    const { status, requestId } = message.message
    const approved = status === 'APPROVED'

    const result = this.approvalManager.resolveRequest(
      requestId,
      approved,
      async (request) => {
        // Execute the approved action
        switch (request.type) {
          case 'CONNECT_WALLET':
            request.wrap(this.wallet.getSigner().address())
            break
          case 'ASSIGNMENT':
            await this._handleAssignment(
              { message: { payload: request.params } },
              request.wrap
            )
            break
          default:
            request.wrap('Unknown approval type', false)
        }
      }
    )

    if (!result.success) {
      return wrap(result.error || 'Failed to resolve approval', false)
    }

    wrap(approved ? 'Approved' : 'Rejected')
  }

  private async routeMessage(
    port: chrome.runtime.Port,
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    const { name: portName } = port
    const { type: messageType } = message

    // 1. Handle Approval Decisions from Extension (strict port check)
    if (messageType === 'resolve_approval_request' && portName === 'extension') {
      return await this.handleApprovalMessage(port, message, wrap)
    }

    // 2. Handle GET_PENDING_APPROVALS (pull-based, only from extension)
    if (messageType === 'GET_PENDING_APPROVALS' && portName === 'extension') {
      const pending = this.approvalManager.getPendingApprovals()
      return wrap(pending)
    }

    // 3. Intercept Sensitive Actions for Approval
    if (messageType === 'CONNECT_WALLET') {
      // SECURITY: Reject if no wallet keys exist
      if (!this.wallet.isWalletInitialized()) {
        return wrap('Wallet not initialized. Please create or import a wallet first.', false)
      }
      const { origin, href, title, favicon } = message.payload || {}
      return await this.requestApproval(
        'CONNECT_WALLET',
        origin || 'unknown',
        title || 'Unknown dApp',
        favicon || '',
        href || '',
        message.payload,
        wrap
      )
    }

    if (messageType === 'ASSIGNMENT') {
      // SECURITY: Reject if no wallet keys exist
      if (!this.wallet.isWalletInitialized()) {
        return wrap('Wallet not initialized. Please create or import a wallet first.', false)
      }
      const { origin, href, title, favicon } = message.payload || {}
      return await this.requestApproval(
        'ASSIGNMENT',
        origin || 'unknown',
        title || 'Unknown dApp',
        favicon || '',
        href || '',
        message.message,
        wrap
      )
    }

    // 4. Normal Routing
    if (portName === 'extension') {
      return await this.dispatchExtensionMessage(message, wrap)
    }

    if (portName === 'applications') {
      return await this.dispatchApplicationMessage(message, wrap)
    }

    console.warn(`⚠️ Unknown port or message type: ${portName}:${messageType}`)
  }

  private processMessageQueue() {
    console.log(`Processing queue: ${this.messageQueue.length} messages`)
    while (this.messageQueue.length > 0) {
      const item = this.messageQueue.shift()
      if (item) {
        // Double check port connection before processing
        if (this.subscribers.has(item.port)) {
          this.routeMessage(item.port, item.message, item.wrap)
        }
      }
    }
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
          this.safePostMessage(port, { requestId, success, data })
        }

        const messageType = message.type

        // IMMEDIATE: GET_WALLET or Resolve Approvals
        if (
          messageType === 'GET_WALLET' ||
          messageType === 'CREATE_WALLET' ||
          messageType === 'SET_WALLET' ||
          messageType === 'resolve_approval_request' ||
          messageType === 'PING'
        ) {
          try {
            await this.routeMessage(port, message, wrap)
          } catch (err) {
            wrap(String(err), false)
          }
          return;
        }

        // SECURITY: Reject sensitive operations early if no wallet exists
        // These should NOT be queued - they need a wallet to work
        const requiresWalletImmediately = [
          'CONNECT_WALLET',
          'ASSIGNMENT',
          'GET_PENDING_APPROVALS',
        ]
        if (requiresWalletImmediately.includes(messageType) && !this.wallet.isWalletInitialized()) {
          return wrap('Wallet not initialized. Please create or import a wallet first.', false)
        }

        // QUEUE: If not ready (client not initialized, but wallet exists)
        if (!this.isReady) {
          console.log(`Queueing message (Client not ready)`)
          this.messageQueue.push({ port, message, wrap })
          return
        }

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
    // const FAUCET_URL = 'http://localhost:8079'
    const FAUCET_URL = 'https://faucet.testnet-conway.linera.net/'
    const faucet = new wasm.Faucet(FAUCET_URL)
    const handler = this.faucetHandlers[op]
    if (!handler) return { success: false, error: 'Invalid operation' }
    try {
      const result = await handler.call(this, faucet)
      await this._initClient() // Initialize client after faucet action
      return result
    } catch (err) {
      return { success: false, error: `${err}` }
    }
  }

  private async _initClient(): Promise<void> {
    // We can't be ready without a wallet
    if (!this.wallet.getWallet() || !this.wallet.getSigner()) {
      console.log('Client Initialization failed: Missing wallet or signer')
      // We do NOT process the queue here because we can't process messages 
      // that require a client if we failed to create one.
      // However, we might want to let the user "create wallet" which is a "GET_WALLET/CREATE_WALLET" 
      // type that bypasses the queue.
      return
    }

    try {
      this.isReady = false // explicitly not ready during init

      await this.client.init(
        this.wasmInstance!,
        this.wallet.getWallet(),
        this.wallet.getSigner()
      )

      // Register message forwarder, need to update this logic better handle notifications type
      this.client.onNotificationCallback = (data: any) => {
        this.broadcastToSubscribers({
          type: 'NOTIFICATION',
          data,
        })
      }

      this.isReady = true
      this.processMessageQueue()

    } catch (error) {
      console.warn('Failed to initialize client:', error)
      this.isReady = false // Ensure we stay not ready
      throw error
    }
  }

  private async _initWallet() {
    // Inject the wasm instance into wallet manager
    this.wallet.setWasmInstance(this.wasmInstance!)
    // Now wallet manager can safely load or create wallets
    try {
      await this.wallet.load()
    } catch (err) {
      return // we don't need to return error here
    }
  }

  private async init() {
    this.isReady = false;
    await WasmManager.init()
    this.wasmInstance = WasmManager.instance

    this.setupPortConnections()
    await this._initWallet()
    try {
      await this._initClient()
    } catch (e) {
      console.log("Client init failed (likely no wallet), waiting for wallet creation")
    }
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
    this.isReady = false
    try {
      const result = await this.wallet.setDefaultChain(message.chain_id)
      // reinitialize client after setting default chain
      await this.client.cleanup()
      await this._initClient()
      wrap(result)
    } catch (error) {
      console.error(error)
      this.isReady = true // recover readiness
      this.processMessageQueue()
    }
  }

  // TODO: use wallet manager to assign chain
  private async _handleAssignment(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    try {
      // set this to make sure we don't process any message at this time
      this.isReady = false
      const { payload } = message.message

      const result = await this.wallet.assign(payload) // assign chain in wallet manager, this will also reinitialize wallet
      // reinitialize client after assignment
      await this.client.cleanup()
      await this._initClient()
      wrap(result)
    } catch (err) {
      wrap(`${err}`, false)
      this.isReady = true // recover readiness
      this.processMessageQueue()
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
