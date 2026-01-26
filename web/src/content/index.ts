const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = function () {
  script.remove()
}
  ; (document.head || document.documentElement).appendChild(script)

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
          favicon: getFaviconWithGoogle(),
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
    console.log(detail.id, e)
  }
})

let walletPort: chrome.runtime.Port | null = null

function getWalletPort(): chrome.runtime.Port {
  function reconnect() {
    walletPort = chrome.runtime.connect({ name: 'applications' })
    attachListeners(walletPort)
  }

  function attachListeners(port: chrome.runtime.Port) {
    port.onMessage.addListener((message) => {
      // Forward notifications to web page
      if (message.type === 'NOTIFICATION') {
        window.dispatchEvent(
          new CustomEvent('linera-wallet-notification', {
            detail: message.data,
          })
        )
        return
      }

      // Forward chain change events to web page
      if (message.type === 'CHAIN_CHANGED') {
        window.dispatchEvent(
          new CustomEvent('linera-wallet-chain-changed', {
            detail: { chainId: message.chainId },
          })
        )
        return
      }
    })

    port.onDisconnect.addListener(() => {
      walletPort = null
      setTimeout(() => {
        reconnect()
      }, 500)
    })
  }

  if (!walletPort) {
    walletPort = chrome.runtime.connect({ name: 'applications' })
    attachListeners(walletPort)
  }

  return walletPort
}

function sendMessage<T = any>(msg: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const port = getWalletPort()
    const requestId = Math.random().toString(36).slice(2)
    msg.requestId = requestId

    function handleResponse(response: any) {
      if (response.requestId !== requestId) return

      port.onMessage.removeListener(handleResponse)
      if (response.success) {
        resolve(response.data)
      } else {
        reject(response.error)
      }
    }

    port.onMessage.addListener(handleResponse)
    port.postMessage(msg)
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
      } catch (err) { }
    }
  }

  // Fallback to origin /favicon.ico
  return new URL('/favicon.ico', location.origin).href
}
