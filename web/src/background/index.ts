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

const pendingConnectRequests = new Map<string, (approved: boolean) => void>();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONNECT_DAPP_REQUEST') {
    const origin = message.origin;
    const requestId = message.requestId;

    chrome.windows.create({
      url: `src/connect_popup/index.html?origin=${encodeURIComponent(origin)}&requestId=${requestId}`,
      type: 'popup',
      width: 400,
      height: 300,
    }, (window) => {
      if (window && window.id) {
        // Store the resolve function for this request
        pendingConnectRequests.set(requestId, (approved: boolean) => {
          sendResponse(approved);
          pendingConnectRequests.delete(requestId);
        });
      }
    });
    return true; // Indicates an asynchronous response
  } else if (message.type === 'CONNECT_DAPP_RESPONSE') {
    const requestId = message.requestId;
    const approved = message.approved;
    const resolve = pendingConnectRequests.get(requestId);
    if (resolve) {
      resolve(approved);
    }
  }
});
