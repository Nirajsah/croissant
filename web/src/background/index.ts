import * as offscreen from './offscreen/offscreen.ts'

offscreen.setupOffscreenDocument()

// Lifecycle management - setup offscreen when service worker starts
// chrome.runtime.onStartup.addListener(offscreen.setupOffscreenDocument)

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  if (message.type === 'OPEN_APPROVAL_POPUP') {
    try {
      const windowId = (await chrome.windows.getCurrent()).id
      if (windowId !== undefined) {
        await chrome.action.openPopup({ windowId })
      }
    } catch (e) { console.error("Could not open popup", e) }
    return
  }
  return true
})
