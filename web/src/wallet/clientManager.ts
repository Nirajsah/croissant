import type { Client, Wallet } from '@linera/wasm-client'
import type { Signer } from '@linera/wasm-client/src/signer/Signer'
import type * as wasmType from '@linera/wasm-client'

export class ClientManager {
  private static _instance: ClientManager | null = null
  private client: Client | null = null
  private notificationHandlerRegistered = false

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
    signer: Signer,
    skipBlockSync = false
  ): Promise<Client> {
    if (this.client) {
      return this.client
    }

    if (!wasmInstance || !wallet || !signer) {
      throw new Error('Missing wasmInstance, wallet, or signer')
    }

    try {
      const client = await new wasmInstance.Client(
        wallet,
        signer,
        skipBlockSync
      )
      this.client = client

      this.registerNotificationHandler()
      return client
    } catch (err) {
      this.cleanup()
      throw err
    }
  }

  /** Register handler only once */
  private registerNotificationHandler() {
    if (!this.client || this.notificationHandlerRegistered) return

    this.client.onNotification((notification: any) => {
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

  async getBalance(): Promise<string | undefined> {
    if (!this.client) {
      return
    }
    try {
      const balance = await this.client!.balance()
      return balance
    } catch (error) {
      console.error(error)
    }
  }

  async query(message: any) {
    try {
      console.log("we are clientmanager", message)
      const app = await this.client!.frontend().application(
        message.applicationId
      )
      const result = await app.query(message.query)
      return result
    } catch (err) {
      throw err
    }
  }

  /** Cleanup resources */
  cleanup() {
    if (this.client) {
      try {
        this.client.free()
      } catch (err) {
        console.warn('Error freeing client:', err)
      }
      this.client = null
      this.notificationHandlerRegistered = false
    }
  }
}
