;(function () {
  if (window.linera) return // Prevent multiple injections

  class LineraProvider {
    request(method: string, params?: any): Promise<any> {
      console.log('[INJECTED] Request:', method, params)
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(2)

        const responseHandler = function listener(event: any) {
          if (event.detail.id === id) {
            console.log('[INJECTED] Got response:', event.detail)
            window.removeEventListener(
              'linera-wallet-response',
              responseHandler
            )

            if (event.detail.message && event.detail.message.error) {
              reject(event.detail.message.error)
            } else {
              resolve(event.detail.message)
            }
          }
        }

        window.addEventListener('linera-wallet-response', responseHandler)

        console.log('[INJECTED] Dispatching request with ID:', id)
        window.dispatchEvent(
          new CustomEvent('linera-wallet-request', {
            detail: { id, message: { method, params } },
          })
        )
      })
    }
  }

  window.linera = new LineraProvider()
})()
