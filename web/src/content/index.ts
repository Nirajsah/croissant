const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = function () {
  script.remove()
}
;(document.head || document.documentElement).appendChild(script)

function respond(id: string, result: any) {
  window.dispatchEvent(
    new CustomEvent('linera-wallet-response', {
      detail: { id, result },
    })
  )
}

window.addEventListener('linera-wallet-request', async (event) => {
  const customEvent = event as CustomEvent
  const detail = customEvent.detail

  if (!detail || !detail.message.type) return

  try {
    const { id, message } = detail
    const { type } = message

    const payload =
      type == 'CONNECT_WALLET' || type === 'ASSIGNMENT'
        ? {
            origin: window.location.origin,
            href: window.location.href,
            title: document.title || 'Unknown DApp',
            favicon: getFavicon(),
          }
        : undefined

    const backgroundMsg = {
      target: 'wallet',
      type,
      ...(payload ? { payload } : {}),
      ...(message ? { message } : {}),
    }
    const response = await sendMessage(backgroundMsg)
    respond(id, response)
  } catch (e) {
    console.log('Request failed:', detail.id, e)
    // Respond with error so the app knows
    respond(detail.id, { success: false, error: String(e) })
  }
})

let walletPort: chrome.runtime.Port | null = null
let reconnecting = false
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

function getWalletPort(): chrome.runtime.Port | null {
  function reconnect() {
    if (reconnecting) return // Already reconnecting

    reconnecting = true
    reconnectAttempts++

    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      reconnecting = false
      return
    }

    console.log(`Reconnecting... attempt ${reconnectAttempts}`)

    setTimeout(() => {
      try {
        walletPort = chrome.runtime.connect({ name: 'applications' })
        attachListeners(walletPort)
        reconnecting = false
        reconnectAttempts = 0 // Reset on successful connection
        console.log('Reconnected successfully')
      } catch (e) {
        console.error('Reconnection failed:', e)
        walletPort = null
        reconnecting = false
        reconnect() // Try again
      }
    }, Math.min(1000 * reconnectAttempts, 10000)) // Exponential backoff, max 10s
  }

  function attachListeners(port: chrome.runtime.Port) {
    const messageListener = (message: any) => {
      // Check if it's a notification (no requestId)
      if (message.type === 'NOTIFICATION') {
        // Forward notification to web page
        window.dispatchEvent(
          new CustomEvent('linera-wallet-notification', {
            detail: message.data,
          })
        )
        return
      }

      if (message.type === 'WALLET_UPDATING') {
        console.log('Wallet is updating...')
        // Optionally notify the app
        window.dispatchEvent(
          new CustomEvent('linera-wallet-status', {
            detail: { status: 'updating' },
          })
        )
      }

      if (message.type === 'WALLET_READY') {
        console.log('Wallet is ready')
        window.dispatchEvent(
          new CustomEvent('linera-wallet-status', {
            detail: { status: 'ready' },
          })
        )
      }
    }

    const disconnectListener = () => {
      console.warn('Port disconnected')

      // Clean up listeners
      try {
        port.onMessage.removeListener(messageListener)
        port.onDisconnect.removeListener(disconnectListener)
      } catch (e) {
        // Ignore cleanup errors
      }

      walletPort = null
      reconnect()
    }

    port.onMessage.addListener(messageListener)
    port.onDisconnect.addListener(disconnectListener)
  }

  if (!walletPort && !reconnecting) {
    try {
      walletPort = chrome.runtime.connect({ name: 'applications' })
      attachListeners(walletPort)
    } catch (e) {
      console.error('Failed to create port:', e)
      return null
    }
  }

  return walletPort
}

function sendMessage<T = any>(msg: any, timeout = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const port = getWalletPort()

    if (!port) {
      return reject(new Error('No connection to wallet'))
    }

    const requestId = Math.random().toString(36).slice(2)
    msg.requestId = requestId

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let disconnectListener: (() => void) | null = null

    function cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      if (disconnectListener && port) {
        try {
          port.onDisconnect.removeListener(disconnectListener)
        } catch (e) {
          // Port might already be destroyed
        }
        disconnectListener = null
      }
    }

    function handleResponse(response: any) {
      if (response.requestId !== requestId) return

      cleanup() // cleanup after every response
      port?.onMessage.removeListener(handleResponse)

      if (response.success) {
        resolve(response.data)
      } else {
        reject(new Error(response.data || response.error || 'Request failed'))
      }
    }

    // Handle disconnect during request
    disconnectListener = () => {
      cleanup()
      port.onMessage.removeListener(handleResponse)
      reject(new Error('Connection lost during request'))
    }

    // Set timeout
    timeoutId = setTimeout(() => {
      cleanup()
      port.onMessage.removeListener(handleResponse)
      reject(new Error(`Request timeout after ${timeout}ms`))
    }, timeout)

    port.onMessage.addListener(handleResponse)
    port.onDisconnect.addListener(disconnectListener)

    try {
      port.postMessage(msg)
    } catch (e) {
      cleanup()
      port.onMessage.removeListener(handleResponse)
      reject(e)
    }
  })
}

function getFaviconWithGoogle(): string {
  try {
    const favicon = getFavicon()

    if (favicon && !favicon.endsWith('/favicon.ico')) {
      return favicon
    }

    // Use Google's favicon service as fallback
    // This works even if the site doesn't have a favicon
    const domain = window.location.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch (err) {
    const domain = window.location.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  }
}

function getFavicon(): string {
  const relSelectors = [
    "link[rel~='icon']",
    "link[rel='shortcut icon']",
    "link[rel='apple-touch-icon']",
    "link[rel='apple-touch-icon-precomposed']",
  ]

  for (const sel of relSelectors) {
    const el = document.querySelector(sel)
    if (!el) continue

    // Cast to HTMLLinkElement if possible
    const link = el as HTMLLinkElement | null
    const rawHref = (link && link.href) || el.getAttribute('href')
    if (rawHref) {
      try {
        return new URL(rawHref, location.href).href
      } catch (err) {
        // skip invalid URL
      }
    }
  }

  // Try Open Graph image
  const og = document.querySelector(
    "meta[property='og:image'], meta[name='og:image']"
  ) as HTMLMetaElement | null
  if (og) {
    const ogUrl = og.content || og.getAttribute('content')
    if (ogUrl) {
      try {
        return new URL(ogUrl, location.href).href
      } catch (err) {}
    }
  }

  // Fallback to origin /favicon.ico
  return new URL('/favicon.ico', location.origin).href
}
