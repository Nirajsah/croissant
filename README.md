# Croissant – Linera Wallet Browser Extension

## Overview

Croissant is a browser extension that provides a seamless interface for interacting with the **Linera blockchain**.

The extension is built with **React**, **TypeScript**, **Vite**, **TailwindCSS**, and **Rust/WASM** for the blockchain client.

**USE `linera-protocol v0.15.4 or v0.15.3` (testnet-conway branch)**

---

## Quick Start

```bash
root/
  |_linera-protocol (v.0.15.4) 
  |_croissant

# Clone the repository
git clone https://github.com/Nirajsah/croissant.git
cd croissant

# Install dependencies (pnpm is recommended)
pnpm install

#Build 
pnpm build # (client and extension)

# Build the WASM client (release)
pnpm --filter wasm-client run build

# Build the extension
pnpm --filter web run build:extension

# Load the extension in Chrome/Edge:
#   1. Open `chrome://extensions/`
#   2. Enable "Developer mode"
#   3. Click "Load unpacked" and select `web/dist` (the built extension)
```

---

## Architecture Diagram

```
+-------------------+          +-------------------+          +--------------------+
|   Web Page (dApp) | <--->    | Content Script    | <--->    | Offscreen document |
| (window.linera)   |          | (injects provider)|          | (wallet server)    |
+-------------------+          +-------------------+          +--------------------+
                                   ^                               |
                                   |                               |
                                   v                               v
                           +-------------------+          +-------------------+
                           |  Injected Script  |          |   WASM Client     |
                           | (web/src/content |          | (wasm-client)    |
                           |   /injected.ts)  |          +-------------------+
                           +-------------------+
```

- **Content Script** injects `injected.js` into the page, exposing `window.linera`.
- **Offscreen document** runs as a service worker, managing the wallet state in IndexedDB and forwarding messages.
- **WASM Client** provides linera client primitives compiled to WebAssembly.

---

## API Overview

### 1. Background → Wallet Server Messages

All messages are sent via `chrome.runtime.sendMessage` (from content script) or `chrome.runtime.onMessage` (in background). The payload always contains a `target: 'wallet'` field.

| Message Type        | Direction                 | Payload                            | Description                                                                   |
| ------------------- | ------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `CONNECT_WALLET`    | Content → Background      | `{ origin, href, title, favicon }` | Requests the user to approve a wallet connection.                             |
| `ASSIGNMENT`        | Content → Background      | `{ origin, href, title, favicon }` | Requests chain assignment for the current dApp.                               |
| `CREATE_WALLET`     | Extension UI → Background | _none_                             | Generates a new wallet using the faucet and stores the mnemonic in IndexedDB. |
| `CREATE_CHAIN`      | Extension UI → Background | _none_                             | Claims a new chain for the current wallet.                                    |
| `GET_WALLET`        | Extension UI → Background | _none_                             | Returns the serialized wallet JSON.                                           |
| `SET_WALLET`        | Extension UI → Background | `{ wallet: string }`               | Overwrites the stored wallet (used for import).                               |
| `GET_BALANCE`       | Extension UI → Background | _none_                             | **(Not implemented yet)** – placeholder for balance query.                    |
| `SET_DEFAULT_CHAIN` | Extension UI → Background | `{ chain_id: string }`             | Sets the default chain for the wallet.                                        |
| `QUERY`             | Extension UI → Background | `{ applicationId, query }`         | Calls `client.frontend().application(...).query(...)`.                        |
| `PING`              | Extension UI → Background | _none_                             | Health‑check, returns `"PONG"`.                                               |

All responses follow the shape:

```ts
{
  requestId: string;
  success: boolean;
  data?: any;   // on success
  error?: string; // on failure
}
```

### 2. Content Script → Injected Provider (`window.linera`)

The injected script (`web/src/content/injected.ts`) creates a `LineraProvider` that implements:

```ts
interface WalletRequest {
  type: 'QUERY' | 'ASSIGNMENT'
  // QUERY fields
  applicationId?: string
  query?: string
  // ASSIGNMENT fields
  chainId?: string
  timestamp?: string
}
```

#### Methods

| Method                                                     | Description                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `request(request: WalletRequest): Promise<WalletResponse>` | Sends a request to the background and resolves with `{ id, result?, error? }`. |
| `on('notification', callback)`                             | Subscribes to wallet notifications (e.g., new block, incoming bundle).         |
| `off('notification', callback)`                            | Unsubscribes from notifications.                                               |

#### Events

- **`linera-wallet-notification`** – forwarded from background (`type: 'NOTIFICATION'`). Payload contains `{ event, ... }`.
- **`linera-wallet-status`** – emitted when the wallet is updating or ready (`status: 'updating' | 'ready'`).

### 3. WASM Client (`@linera/wasm-client`)

The WASM client is published as `@linera/wasm-client` and re‑exported in the extension via the workspace.

All WASM calls return native JavaScript promises.

---

## Testing the Extension

1. Load the unpacked extension from `web/dist`.
2. Open any website (e.g., `https://example.com`) and open the console.
3. Verify that `window.linera` exists:

```js
console.log(window.linera)
```

4. Request a wallet connection:

```js
window.linera
  .request({ type: 'CONNECT_WALLET' })
  .then((res) => console.log('Connected:', res))
  .catch((err) => console.error('Connect error:', err))
```

5. Listen for notifications:

```js
window.linera.on('notification', (data) => console.log('Notification:', data))
```

---

## Contributing

- Fork the repository and create a feature branch.
- Submit a Pull Request with a clear description of the change.

---

## License

This project is licensed under the **Apache-2.0** license. See the `LICENSE` file for details.

---

## Note

This is a fork of linera-web client.

---

_Happy hacking! 🎉_
