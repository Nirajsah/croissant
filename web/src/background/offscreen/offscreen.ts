import { Server } from '../../wallet'

// Track if offscreen document is open
let offscreenDocumentOpen = false

// Connection to offscreen document
let offscreenPort: chrome.runtime.Port | null = null

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
  action: string
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'application_call') {
    port.onMessage.addListener((msg) => {
      console.log('msg', msg)
      const requestId = msg.requestId
      const wrap = (data: any, success = true) => {
        port.postMessage({ requestId, success, data })
      }

      if (msg.payload.type === 'PING') {
        port.postMessage('PONG from offscreen')
      } else {
        wrap(`Unknown message type: ${msg.type}`, false)
      }
    })
  }
})
