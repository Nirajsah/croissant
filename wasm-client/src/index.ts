export { default as PrivateKeySigner } from './signer/PrivateKey.js'
export type { Signer } from './signer/Signer.ts'

// @ts-ignore Generated WASM barrel - files exist in dist/src
export * from './wasm/index.js'
// @ts-ignore Generated WASM barrel - files exist in dist/src
export { default as initialize } from './wasm/index.js'
export * as signer from './signer/index.js'
