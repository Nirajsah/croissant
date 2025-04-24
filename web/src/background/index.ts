import { Server } from '../wallet' // adjust path as needed

// Boot the wallet backend
;(async () => {
  await Server.getInstance()
})()

chrome.runtime.onConnect.addListener(async (port) => {
  const server = await Server.getInstance()
  if (!server) {
    port.postMessage({
      success: false,
      error: 'Server not initialized',
    })
    return
  }
  port.onMessage.addListener(async (msg) => {
    const requestId = msg.requestId
    const wrap = (data: any, success = true) => {
      console.log('wrap called: ', data)
      port.postMessage({ requestId, success, data })
    }

    if (port.name === 'applications') {
      try {
        switch (msg.type) {
          case 'HELLO':
            wrap('Hello from background')
            break
          case 'PING':
            await Server.getInstance()
            wrap('PONG')
            break
          default:
            throw new Error('NOT ALLOWED')
        }
      } catch (error: any) {
        port.postMessage({
          requestId,
          success: false,
          error: error?.message || 'Unknown error',
        })
      }
    } else if (port.name === 'notifications') {
      try {
        switch (msg.type) {
          case 'GET_WALLET':
            const wallet = await server.getWallet()
            wrap(wallet)
            break
          case 'SET_WALLET':
            await server.setWallet(msg.wallet)
            wrap('ok')
            break
          case 'PING':
            await Server.getInstance()
            wrap('PONG')
            break
          default:
            throw new Error('NOT ALLOWED')
        }
      } catch (error: any) {
        port.postMessage({
          requestId,
          success: false,
          error: error?.message || 'Unknown error',
        })
      }
    } else {
      throw new Error('NOT ALLOWED')
    }
  })

  port.onDisconnect.addListener(() => {
    console.log('disconnected')
  })
})
