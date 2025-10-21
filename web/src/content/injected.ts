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

  class LineraProvider {
    request(request: WalletRequest): Promise<WalletResponse> {
      console.log('[INJECTED] Request:', request)
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
  }

  window.linera = new LineraProvider()
})()
