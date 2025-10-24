;(function () {
  type WalletRequest = QueryApplicationRequest | AssignmentRequest

  interface QueryApplicationRequest {
    type: 'QUERY'
    applicationId: string
    query: string
  }

  interface AssignmentRequest {
    type: 'ASSIGNMENT'
    chainId: string
    timestamp: string
  }

  interface WalletResponse {
    id: string
    result?: any
    error?: string
  }

  if (window.linera) return // Prevent multiple injections

  class LineraProvider extends EventTarget {

    constructor() {
      super()
      // Listen for notifications from content script
      this._setupNotificationListener()
    }

    private _setupNotificationListener() {
      window.addEventListener('linera-wallet-notification', (event: Event) => {
        const customEvent = event as CustomEvent
        // Dispatch to dApp listeners
        this.dispatchEvent(
          new CustomEvent('notification', {
            detail: customEvent.detail,
          })
        )
      })
    }

    request(request: WalletRequest): Promise<WalletResponse> {
      // `TODO` Should validate request here
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(2)

        const responseHandler = (event: CustomEvent<WalletResponse>) => {
          if (event.detail.id !== id) return
          window.removeEventListener(
            'linera-wallet-response',
            responseHandler as EventListener
          )

          if (event.detail.error) reject(new Error(event.detail.error))
          else resolve(event.detail)
        }

        window.addEventListener(
          'linera-wallet-response',
          responseHandler as EventListener
        )

        window.dispatchEvent(
          new CustomEvent('linera-wallet-request', {
            detail: { id, message: request },
          })
        )
      })
    }

    on(event: 'notification', callback: (data: any) => void) {
      this.addEventListener(event, ((e: CustomEvent) => {
        callback(e.detail)
      }) as EventListener)
    }

    // Convenience method to unsubscribe
    off(event: 'notification', callback: (data: any) => void) {
      this.removeEventListener(event, callback as EventListener)
    }    
  }

  window.linera = new LineraProvider()
})()
