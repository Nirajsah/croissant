document.addEventListener('DOMContentLoaded', () => {
  const connectButton = document.getElementById('connect-button');
  const cancelButton = document.getElementById('cancel-button');
  const dappOriginElement = document.getElementById('dapp-origin');

  // Get the dApp origin from the URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const dappOrigin = urlParams.get('origin');

  if (dappOriginElement && dappOrigin) {
    dappOriginElement.textContent = `from: ${dappOrigin}`;
  }

  if (connectButton) {
    connectButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'CONNECT_DAPP_RESPONSE', approved: true, origin: dappOrigin });
      window.close();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'CONNECT_DAPP_RESPONSE', approved: false, origin: dappOrigin });
      window.close();
    });
  }
}); 