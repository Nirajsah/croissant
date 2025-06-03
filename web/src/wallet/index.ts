import * as wasm from '@linera/client'
import type { Client, Wallet } from '@linera/client'

import * as guard from './message.guard'

type OpType = 'CREATE_WALLET' | 'CLAIM_CHAIN'
type FaucetHandler = (faucet: wasm.Faucet) => Promise<string>

export class Server {
  private initialized = false
  private wasmInstance: typeof wasm | null = null
  private subscribers = new Set<chrome.runtime.Port>()

  private client: Client | null = null
  private wallet: Wallet | null = null

  constructor() {}

  async setDefaultChain(chain_id: string) {
    if (!this.client) {
      await this.createClient() // client and wallet should be available
    }
    if (!this.client) {
      throw new Error('Client not available')
    }

    if (!this.wallet) {
      this.wallet = await wasm.Wallet.readJsWallet()
    }
    try {
      this.wallet.setDefaultChain(await this.client, chain_id) // TODO!(also need to update the wallet, indexeddb)
    } catch (error) {
      console.error(error)
    }
  }

  async getLocalBalance() {
    if (!this.client) {
      await this.createClient()
    }
    try {
      const balance = await this.client?.localBalance()
      return balance
    } catch (error) {
      console.error(error)
    }
  }

  async setWallet(wallet: string) {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const wasm = this.wasmInstance!
    try {
      console.log('setWallet called: ', wallet)
      const jsWallet = await wasm.Wallet.fromJson(wallet)
      this.wallet = jsWallet
      return 'OK'
    } catch (error) {
      console.error(error)
    }
  }

  async getWallet() {
    if (!this.initialized || !this.wasmInstance) {
      await this.init()
    }
    const wasm = this.wasmInstance!

    try {
      const walletStr = await wasm.Wallet.readWallet()

      console.log('walletStr', walletStr)

      return walletStr
    } catch (error) {
      console.error(error)
    }
  }

  async createClient() {
    // Only create a new client if it's not already created
    // Create the client if not already created
    this.wallet = await wasm.Wallet.readJsWallet()
    const client = new wasm.Client(this.wallet)
    this.wallet = await wasm.Wallet.readJsWallet()
    this.client = client

    // this.client.onNotification((notification: any) => {
    //   console.debug(
    //     'got notification for',
    //     this.subscribers.size,
    //     'subscribers:',
    //     notification
    //   )
    //   for (const subscriber of this.subscribers.values()) {
    //     subscriber.postMessage(notification)
    //     console.log('notification', notification)
    //   }
    // })
  }

  faucetHandlers: Record<OpType, FaucetHandler> = {
    CREATE_WALLET: async (faucet) => {
      console.log('Creating a new wallet...')
      const wallet = await faucet.createWallet()
      console.log('new empty wallet', wallet)
      const client = await new wasm.Client(wallet)
      console.log('client should be working', client)
      this.client = client
      return faucet.claimChain(client) // returns wallet.json
    },

    CLAIM_CHAIN: async (faucet) => {
      if (!this.wallet) {
        this.wallet = await wasm.Wallet.readJsWallet()
      }
      if (!this.client) {
        this.client = await new wasm.Client(this.wallet)
      }
      return faucet.claimChain(this.client)
    },
  }

  /*
   * Logic for creating a new wallet or claiming a new chain for
   * existing wallet using the faucet,
   * and also to set wallet in indexeddb
   */
  async faucetAction(op: OpType) {
    const FAUCET_URL = 'http://localhost:8079'
    const faucet = new wasm.Faucet(FAUCET_URL)
    const handler = this.faucetHandlers[op]
    if (!handler) return 'ERROR: Invalid operation'
    try {
      await handler.call(this, faucet)
    } catch (err) {
      return `ERROR: ${err}`
    }
  }

  async init() {
    if (this.initialized) return

    try {
      await wasm.default()

      this.initialized = true
      this.wasmInstance = wasm

      console.log('wallet initialized ✅')
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

        if (message.type === 'PING') {
          wrap('PONG')
        }

        if (port.name === 'extension') {
          if (guard.isSetWalletRequest(message)) {
            wrap(await this.setWallet(message.wallet))
          } else if (guard.isGetWalletRequest(message)) {
            wrap(await this.getWallet())
          } else if (guard.isCreateWalletRequest(message)) {
            wrap(await this.faucetAction('CREATE_WALLET'))
          } else if (guard.isCreateChainRequest(message)) {
            wrap(await this.faucetAction('CLAIM_CHAIN'))
          } else if (message.type === 'GET_BALANCE') {
            // const balance = {
            //   chainBalance: await this.getChainBalance(),
            //   localBalance: await this.getLocalBalance(),
            // }
            wrap(await this.getLocalBalance())
          } else if (message.type === 'SET_DEFAULT_CHAIN') {
            const res = await this.setDefaultChain(message.chain_id)
            wrap(res)
          }
        }

        if (port.name === 'applications') {
          if (guard.isQueryApplicationRequest(message)) {
            // Make sure client is initialized before using it
            if (!this.client) {
              console.log('creating client again for some reason', this.client)
              await this.createClient()
            }

            if (!this.client) {
              wrap('Client Error')
              return
            }

            try {
              const app = await this.client
                .frontend()
                .application(message.applicationId)

              console.log('application', app)

              const result = await app.query(message.query)
              console.log('application request result:', result)

              wrap(result)
            } catch (err) {
              wrap(err)
            }
          }
        }
      })

      port.onDisconnect.addListener((port) => this.subscribers.delete(port))
    })
  }

  public static async run() {
    new Server().init()
  }
}
