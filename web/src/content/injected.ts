;(function () {
  if (window.linera) return // Prevent multiple injections

  class LineraProvider {
    request(method: string, params?: any): Promise<any> {
      return new Promise((resolve, _) => {
        const id = Math.random().toString(36).substring(2)
        window.addEventListener(
          'linera-wallet-response',
          function listener(event: any) {
            if (event.detail.id === id) {
              window.removeEventListener('linera-wallet-response', listener)
              resolve(event.detail.message)
            }
          }
        )

        window.dispatchEvent(
          new CustomEvent('linera-wallet-request', {
            detail: { id, message: { method, params } },
          })
        )
      })
    }
  }

  window.linera = new LineraProvider()
  console.log('🚀 Linera Wallet injected into window!')
})()
