import type * as wasmType from '@linera/wasm-client'
import { Chain, Client, Wallet } from '@linera/wasm-client'
import { Signer } from '@linera/wasm-client'

export type Request = {
  type: 'QUERY'
  applicationId: string
  query: string
}

export class ClientManager {
  private static _instance: ClientManager | null = null
  private client: Client | null = null
  private notificationAbortHandle: wasmType.NotificationHandle | null = null

  private activeChain: Chain | null = null
  private chains: Map<wasmType.ChainId, Chain> = new Map()

  public onNotificationCallback: ((data: any) => void) | null = null
  public onChainChangedCallback: ((chainId: string) => void) | null = null

  private constructor() { }

  /** Singleton accessor */
  static get instance(): ClientManager {
    if (!this._instance) {
      this._instance = new ClientManager()
    }
    return this._instance
  }

  /** Initialize the client (only once) */
  async init(
    wasmInstance: typeof wasmType,
    wallet: Wallet,
    signer: Signer
  ): Promise<void> {
    if (this.activeChain) {
      return
    }

    if (!wasmInstance || !wallet || !signer) {
      throw new Error('Missing wasmInstance, wallet, or signer')
    }

    try {
      const client = await new wasmInstance.Client(wallet, signer)

      this.client = client
      const chain = await client.chain()
      this.activeChain = chain
    } catch (err) {
      this.cleanup()
      throw err
    }
  }

  async initChainClient(chainId: wasmType.ChainId): Promise<Chain> {
    if (!this.client) {
      throw new Error('Missing Client')
    }

    const chainClient = await this.client.chain(chainId)
    this.chains.set(chainId, chainClient)
    return chainClient
  }

  private notificationAbortHandler() {
    if (this.notificationAbortHandle) {
      this.notificationAbortHandle.unsubscribe()
    }
  }

  /** Register notification handler for active chain (aborts previous if any) */
  async registerNotificationHandler() {
    // Abort existing handler before registering new one
    if (this.notificationAbortHandle) {
      try {
        this.notificationAbortHandler()
      } catch (e) {
        console.warn('Failed to abort previous notification handler:', e)
      }
      this.notificationAbortHandle = null
    }

    if (!this.client || !this.activeChain) return

    // Store the abort handle returned by onNotification
    this.notificationAbortHandle = this.activeChain.onNotification((notification: any) => {
      try {
        const parsed = this.parseNotification(notification)
        if (!parsed) return

        if (this.onNotificationCallback) {
          try {
            this.onNotificationCallback(parsed)
          } catch (callbackErr) {
            console.error('❌ Notification callback failed:', callbackErr)
          }
        }
      } catch (err) {
        console.error('❌ Error handling notification:', err, notification)
      }
    })
  }

  /** Parses a raw WASM notification into a normalized structure */
  private parseNotification(
    notification: any
  ): { event: string;[key: string]: any } | null {
    const reason = notification?.reason
    if (!reason) return null

    // Normalize notification types
    if (reason.NewBlock?.hash) {
      return {
        event: 'NewBlock',
        hash: reason.NewBlock.hash,
        details: reason.NewBlock,
      }
    }

    if (reason.Message) {
      return {
        event: 'Message',
        message: reason.Message,
      }
    }

    if (reason.NewIncomingBundle) {
      const { NewIncomingBundle } = reason
      return {
        event: 'NewIncomingBundle',
        chain_id: notification?.chain_id,
        height: NewIncomingBundle.height,
        origin: NewIncomingBundle.origin,
        details: NewIncomingBundle,
      }
    }

    return null
  }

  async getBalance(chainId?: wasmType.ChainId): Promise<string | undefined> {
    // 1. Early exit if main client is missing
    if (!this.client) {
      console.warn('Main client is not initialized')
      return undefined
    }

    try {
      let targetChain: Chain | undefined | null = this.activeChain

      // 2. If a specific chainId is requested, try to resolve it
      if (chainId) {
        targetChain = this.chains.get(chainId)

        // If not in cache, initialize and cache it
        if (!targetChain) {
          targetChain = await this.initChainClient(chainId)
          // Only set if initialization was successful
          if (targetChain) {
            this.chains.set(chainId, targetChain)
          }
        }
      }

      // 3. Safety Check: Did we find a valid chain client?
      if (!targetChain) {
        console.error(
          `Could not resolve chain client for chainId: ${chainId || 'active'}`
        )
        return undefined
      }

      // 4. Perform the action
      return await targetChain.balance()
    } catch (error) {
      console.error('Error fetching balance:', error)
      return undefined
    }
  }

  async query(req: Request): Promise<string> {
    const app = await this.activeChain!.application(req.applicationId)
    return app.query(req.query)
  }

  async assign(chainId: wasmType.ChainId, owner: string): Promise<void> {
    if (!this.client) throw new Error('Failure...')

    try {
      const chain = await this.client.assignChain(chainId, owner)
      this.activeChain = chain
      this.chains.set(chainId, chain)

      // Re-register notification handler for new active chain
      await this.registerNotificationHandler()

      // Notify subscribers about chain change
      if (this.onChainChangedCallback) {
        this.onChainChangedCallback(chainId)
      }
    } catch (e) {
      throw new Error('Failure...')
    }
  }

  async setChainInUse(chainId: wasmType.ChainId): Promise<void> {
    if (!this.client) throw new Error('Failure...')

    try {
      let chain = this.chains.get(chainId)
      if (!chain) {
        chain = await this.initChainClient(chainId)
      }
      this.activeChain = chain

      // Re-register notification handler for new active chain
      await this.registerNotificationHandler()

      // Notify subscribers about chain change
      if (this.onChainChangedCallback) {
        this.onChainChangedCallback(chainId)
      }
    } catch (e) {
      throw new Error('Failure...')
    }
  }

  /** Cleanup resources, we might not need this after all */
  async cleanup() {
    // Abort notifications first
    if (this.notificationAbortHandle) {
      try {
        this.notificationAbortHandler()
      } catch (e) {
        console.warn('Failed to abort notification handler:', e)
      }
      this.notificationAbortHandle = null
    }

    if (this.client) {
      try {
        // this.client.stop()
        await new Promise((resolve) => setTimeout(resolve, 150))
        this.client.free()
        this.client = null
      } catch (err) {
        console.error('❌ Error during cleanup:', err)
        this.client = null
      }
    }
  }
}

// client manager manages all the Chain.
