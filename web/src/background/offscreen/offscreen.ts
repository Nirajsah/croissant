import { Server } from '../../wallet'

// Initialize the WASM wallet server
export async function initWalletServer() {
  try {
    await Server.init()

    return true
  } catch (error) {
    console.error('Failed to initialize WASM:', error)
    return false
  }
}

// Track if offscreen document is open
let offscreenDocumentOpen = false

// // Create or focus offscreen document
export async function setupOffscreenDocument() {
  if (offscreenDocumentOpen) return

  const offscreenUrl = chrome.runtime.getURL(
    'src/background/offscreen/index.html'
  )

  try {
    // Check if document is already open
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [
        'OFFSCREEN_DOCUMENT' as unknown as chrome.runtime.ContextType,
      ],
      documentUrls: [offscreenUrl],
    })

    if (existingContexts.length > 0) {
      offscreenDocumentOpen = true
      return
    }

    // Create offscreen document
    await chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ['WORKERS' as unknown as chrome.offscreen.Reason],
      justification: 'Web3 wallet requires WASM with threads',
    })

    offscreenDocumentOpen = true

    console.log('Here we go from offscreen document')
  } catch (error) {
    console.error('Failed to create offscreen document:', error)
  }
}

type Message = {
  requestId: string
  type: string
  target: string
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'notifications' || port.name === 'applications') {
    port.onMessage.addListener((message: any) => {
      console.log('Message', message)
    })
  }
})
