import { setupOffscreenDocument } from './offscreen/offscreen'
import { Server } from '../wallet'

type Message = {
  requestId: string
  type: string
}

function makeAppCall(message: any): Promise<any> {
  return new Promise((resolve, _) => {
    const port = chrome.runtime.connect({ name: 'application_call' })
    console.log('message inside appcall', message)

    port.postMessage({ target: 'offscreen', payload: message })

    port.onMessage.addListener(function listener(msg) {
      resolve(msg)
      port.onMessage.removeListener(listener) // Clean up
    })
  })
}

// Handle connections from extension UI components
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'extension' || port.name === 'applications') {
    port.onMessage.addListener(async (message) => {
      const serverInstance = await Server.getInstance()
      const requestId = message.requestId
      const wrap = (data: any, success = true) => {
        port.postMessage({ requestId, success, data })
      }
      try {
        await setupOffscreenDocument()

        if (port.name === 'extension') {
          try {
            switch (message.type) {
              case 'GET_WALLET':
                const wallet = await serverInstance.getWallet()
                wrap(wallet)
                break
              case 'SET_WALLET':
                await serverInstance.setWallet(message.wallet)
                wrap('ok')
                break
              case 'PING':
                await Server.run()
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
        } else if (port.name === 'applications') {
          const res = await makeAppCall(message)
          wrap(res)
        }
      } catch (error: any) {
        port.postMessage({ error: error.message })
      }
    })
  }
})

// Forward to offscreen document
// port.onMessage.addListener(async (message) => {
//   const serverInstance = await Server.getInstance()
//   const requestId = message.requestId
//   const wrap = (data: any, success = true) => {
//     port.postMessage({ requestId, success, data })
//   }
//   try {
//     await setupOffscreenDocument()
//
//     if (port.name === 'extension') {
//       try {
//         switch (message.type) {
//           case 'GET_WALLET':
//             const wallet = await serverInstance.getWallet()
//             wrap(wallet)
//             break
//           case 'SET_WALLET':
//             await serverInstance.setWallet(message.wallet)
//             wrap('ok')
//             break
//           case 'PING':
//             await Server.run()
//             wrap('PONG')
//             break
//           default:
//             throw new Error('NOT ALLOWED')
//         }
//       } catch (error: any) {
//         port.postMessage({
//           requestId,
//           success: false,
//           error: error?.message || 'Unknown error',
//         })
//       }
//     } else if (port.name === 'applications') {
//       console.log('[SW] Got connection from content script')
//
//       // Forward the message to offscreen document
//       const messageId = message.requestId
//
//       console.log('message inside', message, messageId)
//
//       port.postMessage({
//         target: 'offscreen',
//         action: 'application_call',
//         ...message,
//       })
//     } else {
//       throw new Error('NOT ALLOWED')
//     }
//     // Send response back to original port
//   } catch (error) {
//     port.postMessage({ error: error.message })
//   }
// })
//
// port.onDisconnect.addListener(() => {
//   console.log('disconnected')
// })

// Lifecycle management - setup offscreen when service worker starts
chrome.runtime.onStartup.addListener(setupOffscreenDocument)
