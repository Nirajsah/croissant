/*
 * Service work should only be used as a proxy for offscreen document,
 * its main purpose is to send/recieve messages from offscreen document
 */

import * as offscreen from './offscreen/offscreen.ts'

// Adding welcome after first installation
// chrome.sidePanel
//   .setPanelBehavior({
//     openPanelOnActionClick: true,
//   })
//   .catch(console.error)
//
// chrome.runtime.onInstalled.addListener(async () => {
//   const windowId = (await chrome.windows.getCurrent()).id
//   if (windowId === undefined) return
//   chrome.action.setPopup({ popup: 'src/popup/welcome.html' })
//   await chrome.action.openPopup({ windowId })
// })

offscreen.setup()

// import { setupOffscreenDocument } from './offscreen/offscreen'

// type Message = {
//   requestId: string
//   type: string
// }
//
// function sendMessage(message: any, connectingPort: string): Promise<any> {
//   return new Promise((resolve, _) => {
//     const port = chrome.runtime.connect({ name: connectingPort })
//
//     port.postMessage({ target: 'offscreen', payload: message })
//
//     port.onMessage.addListener(function listener(msg) {
//       resolve(msg)
//       port.onMessage.removeListener(listener) // Clean up
//     })
//   })
// }
//
// async function makeAppCall(message: any) {
//   const APP_PORT = 'application_call'
//   const { result } = await sendMessage(message, APP_PORT)
//   return result
// }
//
// async function makeExtCall(message: any) {
//   const EXT_PORT = 'extension_call'
//   const { result } = await sendMessage(message, EXT_PORT)
//   return result
// }
//
// // Handle connections from extension UI components
// chrome.runtime.onConnect.addListener((port) => {
//   if (port.name === 'extension' || port.name === 'applications') {
//     port.onMessage.addListener(async (message) => {
//       const requestId = message.requestId
//       const wrap = (data: any, success = true) => {
//         port.postMessage({ requestId, success, data })
//       }
//       try {
//         await setupOffscreenDocument()
//         const result =
//           port.name === 'extension'
//             ? await makeExtCall(message)
//             : await makeAppCall(message)
//
//         wrap(result)
//       } catch (error: any) {
//         port.postMessage({
//           requestId,
//           success: false,
//           error: error?.message || 'Unknown error',
//         })
//       }
//     })
//   }
// })
//
// // Lifecycle management - setup offscreen when service worker starts
// chrome.runtime.onStartup.addListener(offscreen.setupOffscreenDocument)
