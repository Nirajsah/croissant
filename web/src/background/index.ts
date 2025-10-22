import * as offscreen from './offscreen/offscreen.ts'

// Adding welcome after first installation
// chrome.sidePanel
//   .setPanelBehavior({
//     openPanelOnActionClick: true,
//   })
//   .catch(console.error)
//
// chrome.runtime.onInstalled.addListener(async () => {
//   const windowId = (await chrome.windows.getCurrent()).id
//   if (windowId === undefined) return
//   chrome.action.setPopup({ popup: 'src/popup/welcome.html' })
//   await chrome.action.openPopup({ windowId })
// })

offscreen.setupOffscreenDocument()

// Lifecycle management - setup offscreen when service worker starts
chrome.runtime.onStartup.addListener(offscreen.setupOffscreenDocument)

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'CONNECT_WALLET') {
    console.log('Received CONNECT_WALLET message in background script')
    const windowId = (await chrome.windows.getCurrent()).id
    if (windowId === undefined) return
    await chrome.action.openPopup({
      windowId,
    })
    chrome.runtime.sendMessage({
      type: 'OPEN_APPROVAL_POPUP',
      requestId: message.requestId,
      payload: message.payload,
    })
  }
})
