import { setupOffscreenDocument, initWalletServer } from './offscreen/offscreen'
import { Server } from '../wallet'
// ;(async function call() {
//   await setupOffscreenDocument()
// })()

type Message = {
  requestId: string
  type: string
}

// chrome.runtime.onConnect.addListener(async (port) => {
//   port.onMessage.addListener(async (msg: Message) => {
//     const requestId = msg.requestId
//     const wrap = (data: any, success = true) => {
//       console.log('wrap called: ', data)
//       port.postMessage({ requestId, success, data })
//     }
//
//     if (msg.type === 'PING') {
//       await initWalletServer()
//     }
//
//     console.log('message', msg)
//   })
//
//   port.onDisconnect.addListener(() => {
//     console.log('disconnected')
//   })
// })

// Handle connections from extension UI components
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'extension' || port.name === 'applications') {
    // Forward to offscreen document
    port.onMessage.addListener(async (message) => {
      const requestId = message.requestId
      const wrap = (data: any, success = true) => {
        console.log('wrap called', data)
        port.postMessage({ requestId, success, data })
      }
      try {
        await setupOffscreenDocument()

        if (port.name === 'extension') {
          console.log('message', message, port)
          const s = await Server.run()
          if (message.type === 'GET_WALLET') wrap(await s.getWallet())
        }

        if (port.name === 'applications') {
          // Forward the message to offscreen document
          const response = port.postMessage({
            target: 'offscreen',
            action: 'portMessage',
            portName: port.name,
            payload: message,
          })

          port.postMessage(response)
        }
        // Send response back to original port
      } catch (error) {
        port.postMessage({ error: error.message })
      }
    })
  }
})

// // Handle wallet-related requests
// async function handleWalletRequest(message, sender, sendResponse) {
//   try {
//     await setupOffscreenDocument()
//
//     // Forward request to offscreen document
//     const response = await chrome.runtime.sendMessage({
//       target: 'offscreen',
//       action: message.action,
//       payload: message.payload,
//     })
//
//     sendResponse(response)
//   } catch (error) {
//     sendResponse({ error: error.message })
//   }
// }

// Lifecycle management - setup offscreen when service worker starts
chrome.runtime.onStartup.addListener(setupOffscreenDocument)
