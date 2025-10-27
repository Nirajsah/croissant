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
  private signer: PrivateKeySigner | null = null

  private initLock: Promise<void> | null = null
  private notificationHandlerRegistered = false
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
      console.warn('Failed to send message, removing disconnected port:', error)
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

  // private async setDefaultChain(chain_id: string): Promise<Result<string>> {
  //   try {
  //     let newWallet = await this.wasmInstance!.Wallet.get()
  //     if (!newWallet) {
  //       return { success: false, error: 'No wallet found' }
  //     }
  //     this.wallet = newWallet
  //     await this.wallet!.setDefault(chain_id)
  //     if (this.client) {
  //       this.client.free()
  //       this.client = null // Will be recreated on next use
  //     }
  //     return { success: true, data: `Default chain set to ${chain_id}` }
  //   } catch (error) {
  //     console.error(error)
  //     return { success: false, error: `${error}` }
  //   }
  // }
  private async setDefaultChain(chain_id: string): Promise<Result<string>> {
    try {
      // DON'T call Wallet.get() again - it may invalidate your current wallet
      if (!this.wallet) {
        return { success: false, error: 'No wallet found' }
      }

      await this.wallet.setDefault(chain_id)

      // Clean up client to force recreation with new default chain
      await this._cleanupClient()

      return { success: true, data: `Default chain set to ${chain_id}` }
    } catch (error) {
      console.error(error)
      return { success: false, error: `${error}` }
    }
  }

  private async _cleanupClient() {
    if (this.client) {
      try {
        this.client.free()
      } catch (e) {
        console.warn('Error freeing client:', e)
      }
      this.client = null
      this.notificationHandlerRegistered = false
    }
  }

  private async _cleanupAll() {
    await this._cleanupClient()

    if (this.wallet) {
      try {
        this.wallet.free()
      } catch (e) {
        console.warn('Error freeing wallet:', e)
      }
      this.wallet = null
    }

    this.signer = null
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
      await this._cleanupAll()
      const wallet = await this.wasmInstance!.Wallet.setJsWallet(_wallet)
      this.wallet = wallet
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

  private async _initClient() {
    if (!this.wallet) {
      throw new Error('Wallet must be initialized before creating client')
    }

    try {
      const mn = await new this.wasmInstance!.Secret().get('mn')
      const signer = PrivateKeySigner.fromMnemonic(mn)
      this.signer = signer

      // Creating client consumes the wallet reference internally
      // Store it before creating client
      const walletRef = this.wallet
      this.client = await new wasm.Client(walletRef, signer, false)

      // Register notification handler only once
      if (!this.notificationHandlerRegistered && this.client) {
        this.client.onNotification((notification: any) => {
          const reason = notification?.reason
          let data: any

          if (reason?.NewBlock && reason.NewBlock.hash) {
            data = {
              event: 'NewBlock',
              hash: reason.NewBlock.hash,
              details: reason.NewBlock,
            }
          } else if (reason?.Message) {
            data = { event: 'Message', message: reason.Message }
          } else if (reason?.NewIncomingBundle) {
            // Handle NewIncomingBundle type safely
            data = {
              event: 'NewIncomingBundle',
              chain_id: notification?.chain_id,
              height: reason.NewIncomingBundle.height,
              origin: reason.NewIncomingBundle.origin,
              details: reason.NewIncomingBundle,
            }
          } else {
            // Fallback for unknown notification types: log and skip
            // We know of two notification types as of now.
            console.warn('Unrecognized notification:', notification)
            return
          }

          // Only broadcast if we have active subscribers
          if (this.subscribers.size > 0) {
            this.broadcastToSubscribers({
              type: 'NOTIFICATION',
              data,
            })
          }
        })
        this.notificationHandlerRegistered = true
      }

      // Refresh wallet reference after client creation
      // The wallet may have been consumed, get fresh reference
      const newWallet = await this.wasmInstance!.Wallet.get()
      if (!newWallet) {
        throw new Error('Wallet not found after client creation')
      }

      // DON'T free the old wallet
      this.wallet = newWallet
    } catch (error) {
      // Clean up on error
      await this._cleanupClient()
      throw error
    }
  }

  private async _ensureClientAndWallet() {
    // Use lock to prevent concurrent initialization
    if (this.initLock) {
      await this.initLock
      return
    }

    this.initLock = (async () => {
      try {
        // If we already have both, we're done
        if (this.wallet && this.client) {
          return
        }

        // If we have neither, get wallet first
        if (!this.wallet && !this.client) {
          let wallet = await this.wasmInstance!.Wallet.get()
          if (!wallet) {
            throw new Error('No wallet found')
          }
          this.wallet = wallet
        }

        // If we have wallet but no client, initialize client
        if (this.wallet && !this.client) {
          await this._initClient()
        }
      } finally {
        this.initLock = null
      }
    })()

    await this.initLock
  }

  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      // Clean up any existing wallet/client
      await this._cleanupAll()

      const vault = new this.wasmInstance!.Secret()
      const mnemonic = PrivateKeySigner.mnemonic()
      const signer = PrivateKeySigner.fromMnemonic(mnemonic)

      await vault.set('mn', mnemonic)

      const wallet = await faucet.createWallet()
      this.wallet = wallet
      this.signer = signer

      let chainId = await faucet.claimChain(wallet, signer.address())

      return { success: true, data: chainId }
    },
    CLAIM_CHAIN: async (faucet) => {
      await this._ensureClientAndWallet()

      if (!this.wallet || !this.signer) {
        throw new Error('Wallet and signer must be initialized')
      }

      return {
        success: true,
        data: await faucet.claimChain(this.wallet, this.signer.address()),
      }
    },
  }

  /*
   * Logic for creating a new wallet and claiming a new chain for
   * existing wallet using the faucet,
   * and also to set wallet in indexeddb
   */
  private async faucetAction(op: OpType): Promise<Result<string>> {
    // const FAUCET_URL = 'http://localhost:8079' // for dev
    const FAUCET_URL = import.meta.env.VITE_FAUCET_URL
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
          // Register notification handler with safe broadcasting
          console.log('sending response to', port, data, message)
          this.safePostMessage(port, {
            requestId,
            success,
            data,
          })
        }

        if (
          message.type === 'CONNECT_WALLET' ||
          message.type === 'ASSIGNMENT'
        ) {
          try {
            await chrome.runtime.sendMessage({ ...message })
          } catch (err) {
            wrap(err, false)
            return
          }
          return
        }

        const portName = port.name
        const messageType = message.type

        if (message.type === 'APPROVAL' && port.name === 'extension') {
          const { status, approvalType } = message.message

          const response = {
            requestId: message.message.requestId,
            success: status === 'APPROVED',
            data: '',
          }

          const sendResponseToSubscribers = () => {
            this.broadcastToSubscribers(
              response,
              (subscriber) =>
                subscriber.name === 'applications' && subscriber !== port
            )
            wrap('Done')
          }

          if (
            status === 'APPROVED' &&
            approvalType === 'connect_wallet_request'
          ) {
            try {
              const mn = await new this.wasmInstance!.Secret().get('mn')
              const signer = PrivateKeySigner.fromMnemonic(mn)
              response.data = signer.address()
            } catch (err) {
              console.error('Failed to get address:', err)
              response.success = false
              response.data = 'failed to get address'
            }
            sendResponseToSubscribers()
          } else if (
            status === 'APPROVED' &&
            approvalType === 'assign_chain_request'
          ) {
            try {
              await this._handleAssignment(message, wrap)
              response.data = 'Assigned'
            } catch (err) {
              console.error('Failed to assign chain:', err)
              response.success = false
              response.data = 'failed to assign chain'
            }
            sendResponseToSubscribers()
          } else {
            sendResponseToSubscribers()
          }
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
          QUERY: [
            guard.isQueryApplicationRequest,
            async (message) =>
              this._handleQueryApplicationRequest(message, wrap),
          ],
          ASSIGNMENT: [
            guard.isAssignmentRequest,
            async (message) => await this._handleAssignment(message, wrap),
          ],
        }

        if (portName === 'extension') {
          const handlerTuple = extensionHandlers[messageType]
          if (handlerTuple && handlerTuple[0](message)) {
            await handlerTuple[1](message)
          } else if (message.type === 'PING') {
            await this._handlePing(wrap)
          }
        }

        if (portName === 'applications') {
          const handlerTuple = applicationHandlers[messageType]
          if (handlerTuple && handlerTuple[0](message)) {
            await handlerTuple[1](message.message)
          }
        }
      })

      port.onDisconnect.addListener(() => {
        console.log(`Port disconnected: ${port.name}`)
        this.subscribers.delete(port)
        console.log(`Remaining subscribers: ${this.subscribers.size}`)

        if (chrome.runtime.lastError) {
          console.log(
            'Port disconnect error:',
            chrome.runtime.lastError.message
          )
        }
      })
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

  private async _handleAssignment(
    message: any,
    wrap: (data: any, success?: boolean) => void
  ) {
    try {
      // Don't call Wallet.get() if we already have a wallet
      if (!this.wallet) {
        const wallet = await this.wasmInstance!.Wallet.get()
        if (!wallet) {
          return wrap('Wallet not found', false)
        }
        this.wallet = wallet
      }

      if (!this.signer) {
        const mn = await new this.wasmInstance!.Secret().get('mn')
        this.signer = PrivateKeySigner.fromMnemonic(mn)
      }

      const { payload } = message.message

      await this.wallet.assignChain(
        this.signer.address(),
        payload.chainId,
        payload.timestamp
      )

      // Clean up client to force refresh, but DON'T free wallet
      await this._cleanupClient()

      // Refresh wallet reference after assignment
      const newWallet = await this.wasmInstance!.Wallet.get()
      if (newWallet) {
        this.wallet = newWallet
      }

      wrap('Assigned')
    } catch (err) {
      console.error('Assignment error:', err)
      wrap(`${err}`, false)
    }
  }

  // private async _handleAssignment(
  //   message: any,
  //   wrap: (data: any, success?: boolean) => void
  // ) {
  //   const wallet = await this.wasmInstance!.Wallet.get()
  //   const mn = await new this.wasmInstance!.Secret().get('mn')
  //   const signer = PrivateKeySigner.fromMnemonic(mn)

  //   if (!wallet || !signer) return wrap('Client Error', false)

  //   this.signer = signer
  //   this.wallet = wallet

  //   const { payload } = message.message
  //   try {
  //     await this.wallet.assignChain(
  //       this.signer.address(),
  //       payload.chainId,
  //       payload.timestamp
  //     )

  //     // free up the old state of this.wallet & this.client after wallet update,
  //     // default chain changes.
  //     if (this.client) {
  //       this.client.free()
  //       this.wallet.free()
  //       this.client = null
  //     }

  //     wrap('Assigned')
  //   } catch (err) {
  //     wrap(err, false)
  //   }
  // }

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

  public static async run() {
    new Server().init()
  }
}
