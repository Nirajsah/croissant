import { Server } from '../wallet' // adjust path as needed

// Boot the wallet backend
Server.run()

chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
  console.log('🔄 Background received:', message)
  const server = Server.getInstance()
  if (!server) {
    console.error('Server not initialized')
    sendResponse({ error: 'Server not initialized' })
    return
  }

  if (message.target !== 'wallet') return

  if (message.type === 'set-wallet') {
    await server.setWallet(message.wallet)
    return
  }

  if (message.type === 'get-wallet') {
    sendResponse(await server.getWallet())
    return
  }

  if (message.type === 'say_hello') {
    sendResponse('Hello from Linera Wallet!')
  } else {
    sendResponse({ error: 'Unknown method' })
  }

  return true // Keeps the message channel open for async responses
})
