import { Server } from '../wallet' // adjust path as needed

// Boot the wallet backend
Server.run()

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  console.log('🔄 Background received:', message)
  if (message.target !== 'wallet') return

  if (message.type === 'say_hello') {
    sendResponse('Hello from Linera Wallet!')
  } else {
    sendResponse({ error: 'Unknown method' })
  }

  return true // Keeps the message channel open for async responses
})
