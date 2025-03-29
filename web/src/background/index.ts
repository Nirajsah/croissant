// import { Server } from '../wallet/index'

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  console.log('🔄 Background received:', message)

  if (message.method === 'say_hello') {
    sendResponse('Hello from Linera Wallet!')
  } else {
    sendResponse({ error: 'Unknown method' })
  }

  return true // Keeps the message channel open for async responses
})
