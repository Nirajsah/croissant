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
  const response = await chrome.runtime.sendMessage(e.detail.message)
  respond(e.detail.id, response)
})

const notifications = chrome.runtime.connect({ name: 'notifications' })
notifications.onMessage.addListener((message: any) => {
  console.debug('content script got notification')
  window.dispatchEvent(
    new CustomEvent('linera-wallet-notification', {
      detail: message,
    })
  )
})
