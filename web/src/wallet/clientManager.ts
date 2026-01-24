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
  private notificationHandlerRegistered = false

  private activeChain: Chain | null = null
  private chains: Map<wasmType.ChainId, Chain> = new Map()

  public onNotificationCallback: ((data: any) => void) | null = null

  private constructor() {}

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

  /** Register handler only once */
  async registerNotificationHandler() {
    if (!this.client || this.notificationHandlerRegistered || !this.activeChain)
      return

    this.activeChain.onNotification((notification: any) => {
      try {
        const parsed = this.parseNotification(notification)

        if (!parsed) {
          return
        }

        // Notify subscribers safely
        if (this.onNotificationCallback) {
          try {
            this.onNotificationCallback(parsed)
          } catch (callbackErr) {
            console.error('❌ Notification callback failed:', callbackErr)
          }
        } else {
          console.debug(
            '🔔 Notification received (no handler registered):',
            parsed
          )
        }
      } catch (err) {
        console.error('❌ Error handling notification:', err, notification)
      }
    })

    this.notificationHandlerRegistered = true
  }

  /** Parses a raw WASM notification into a normalized structure */
  private parseNotification(
    notification: any
  ): { event: string; [key: string]: any } | null {
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

    // (future-proofing) we don't know about `event` type yet, also we don't need it for now
    // if (reason.event) {
    //   const { Event } = reason
    //   return {
    //     event: 'event',
    //     timestamp: Event.timestamp ?? null,
    //     details: Event,
    //   }
    // }

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

  async query(req: Request) {
    const app = await this.activeChain!.application(req.applicationId)
    const result = await app.query(req.query)
    return result
  }

  async assign(chainId: wasmType.ChainId, owner: string): Promise<void> {
    if (!this.client) throw new Error('Failure...')

    try {
      const chain = await this.client.assignChain(chainId, owner)
      this.activeChain = chain
      this.chains.set(chainId, chain)
    } catch (e) {
      throw new Error('Failure...')
    }
  }

  /** Cleanup resources */
  async cleanup() {
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
      this.notificationHandlerRegistered = false
    }
  }
}

// client manager manages all the Chain.
