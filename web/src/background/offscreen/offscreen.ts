import * as wallet from '../../wallet'

// // Track if offscreen document is open
// let offscreenDocumentOpen = false
//
// // Create or focus offscreen document
// export async function setupOffscreenDocument() {
//   if (offscreenDocumentOpen) return
//
//   const offscreenUrl = chrome.runtime.getURL(
//     'src/background/offscreen/index.html'
//   )
//
//   try {
//     // Check if document is already open
//     const existingContexts = await chrome.runtime.getContexts({
//       contextTypes: [
//         'OFFSCREEN_DOCUMENT' as unknown as chrome.runtime.ContextType,
//       ],
//       documentUrls: [offscreenUrl],
//     })
//
//     if (existingContexts.length > 0) {
//       offscreenDocumentOpen = true
//       return
//     }
//
//     // Create offscreen document
//     await chrome.offscreen.createDocument({
//       url: offscreenUrl,
//       reasons: ['WORKERS' as unknown as chrome.offscreen.Reason],
//       justification: 'Web3 wallet requires WASM with threads',
//     })
//
//     offscreenDocumentOpen = true
//
//     console.log('Here we go from offscreen document')
//   } catch (error) {
//     console.error('Failed to create offscreen document:', error)
//   }
// }
//
// // export async function server() {
// wallet.Server.run()

// import * as wallet from '@/wallet'

let creating: Promise<void> | null // A global promise to avoid concurrency issues

export async function setup() {
  console.log('Creating offscreen document')
  // This is a bit of a hack: I'd like to import the URL of the
  // processed HTML instead of making it a root, but I can't find a
  // way to do so in Vite.
  const offscreenUrl = chrome.runtime.getURL(
    'src/background/offscreen/index.html'
  )

  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [
      'OFFSCREEN_DOCUMENT' as unknown as chrome.runtime.ContextType,
    ],
    documentUrls: [offscreenUrl],
  })

  if (existingContexts.length > 0) {
    console.log('Found existing offscreen document')
    return
  }

  if (!creating)
    creating = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['WORKERS' as unknown as chrome.offscreen.Reason],
      justification: 'to run heavy work in the background',
    })

  console.log('Awaiting document creation')

  await creating

  console.log('Document created')
  creating = null
}

export async function server() {
  wallet.Server.run()
}

// type Message = {
//   requestId: string
//   target: string
//   action: string
//   payload: {
//     type: string
//     wallet: any
//   }
// }
//
// async function makeExtCall(message: Message) {
//   const serverInstance = await Server.getInstance()
//   try {
//     switch (message.payload.type) {
//       case 'GET_WALLET':
//         const wallet = await serverInstance.getWallet()
//         return wallet
//       case 'SET_WALLET':
//         await serverInstance.setWallet(message.payload.wallet)
//         return 'OK'
//       case 'PING':
//         await Server.run()
//         return 'PONG'
//       default:
//         throw new Error('NOT ALLOWED')
//     }
//   } catch (error: any) {
//     return error
//   }
// }
//
// async function makeAppCall(message: Message) {
//   const serverInstance = await Server.getInstance()
//   const wasmInstance = Server.wasmInstance!
//   try {
//     switch (message.payload.type) {
//       case 'PING':
//         await Server.run()
//         return 'PONG'
//       case 'FRONTEND':
//         if (!serverInstance.client) {
//           const client = await new wasmInstance.Client(serverInstance.wallet)
//           serverInstance.client = client
//         }
//         console.log(
//           'wallet',
//           serverInstance.wallet,
//           await serverInstance.client.identity()
//         )
//
//         const app = await serverInstance.client
//           .frontend()
//           .application(
//             'cddbbb6317a35331820adae3082d152cb1fdbdd8533abed004d64df6ef2b40ee'
//           )
//
//         console.log('application', app)
//
//         const res = await app.query('{ "query": "query { value }" }')
//         console.log('result', res)
//
//         return 'OK'
//       default:
//         throw new Error('NOT ALLOWED')
//     }
//   } catch (error: any) {
//     return error
//   }
// }
//
// chrome.runtime.onConnect.addListener(async (port) => {
//   const server = await Server.run()
//   port.onMessage.addListener(async (message: Message) => {
//     let result: any
//     try {
//       if (port.name === 'extension_call') {
//         result = await makeExtCall(message)
//       } else if (port.name === 'application_call') {
//         result = await makeAppCall(message)
//       } else {
//         throw new Error('Invalid port')
//       }
//     } catch (e: any) {
//       result = { error: e?.message ?? 'Unknown error' }
//     }
//
//     port.postMessage({ result }) // unified response
//   })
// })
