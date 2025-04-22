import { Server } from '../wallet' // adjust path as needed

// Boot the wallet backend
;(async () => {
  await Server.getInstance()
})()

chrome.runtime.onConnect.addListener(async (port) => {
  const server = await Server.getInstance()
  if (!server) {
    console.error('Server not initialized')
    return
  }
  port.onMessage.addListener(async (msg) => {
    const requestId = msg.requestId
    const wrap = (data: any, success = true) => {
      port.postMessage({ requestId, success, data })
    }

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
        default:
          wrap({ error: 'Unknown message type' }, false)
      }
    } catch (error: any) {
      port.postMessage({
        requestId,
        success: false,
        error: error?.message || 'Unknown error',
      })
    }
  })

  port.onDisconnect.addListener(() => {
    console.log('Port disconnected')
  })
})
