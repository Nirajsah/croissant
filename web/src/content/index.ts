const script = document.createElement('script')
script.src = chrome.runtime.getURL('injected.js')
script.onload = function () {
  script.remove()
}
;(document.head || document.documentElement).appendChild(script)

type RequestEvent = CustomEvent<{ id: string; message: any }>

function respond(id: string, message: any) {
  window.dispatchEvent(
    new CustomEvent('linera-wallet-response', {
      detail: { id, message },
    })
  )
}

window.addEventListener('linera-wallet-request', async (event) => {
  const e = event as RequestEvent
  console.log('message received in contentscript', e.detail)

  try {
    const backgroundMsg = {
      type: e.detail.message.type,
      target: 'wallet',
      applicationId: e.detail.message.applicationId,
      query: e.detail.message.query,
    }

    const response = await sendMessage(backgroundMsg)
    respond(e.detail.id, response)
  } catch (err) {
    respond(e.detail.id, { error: err.message || 'MESSAGE NOT FOUND' })
  }
})

let walletPort: chrome.runtime.Port | null = null

function getWalletPort(): chrome.runtime.Port {
  function reconnect() {
    walletPort = chrome.runtime.connect({ name: 'applications' })
    attachListeners(walletPort)
  }

  function attachListeners(port: chrome.runtime.Port) {
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
