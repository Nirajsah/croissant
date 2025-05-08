/*
 * Generated type guards for "message.ts".
 * WARNING: Do not manually change this file.
 */
import {
  GetWalletRequest,
  SetWalletRequest,
  QueryApplicationRequest,
  MutationApplicationRequest,
} from './message'

export function isGetWalletRequest(obj: unknown): obj is GetWalletRequest {
  const typedObj = obj as GetWalletRequest
  return (
    ((typedObj !== null && typeof typedObj === 'object') ||
      typeof typedObj === 'function') &&
    typeof typedObj['target'] === 'string' &&
    typedObj['type'] === 'GET_WALLET'
  )
}

export function isSetWalletRequest(obj: unknown): obj is SetWalletRequest {
  const typedObj = obj as SetWalletRequest
  return (
    ((typedObj !== null && typeof typedObj === 'object') ||
      typeof typedObj === 'function') &&
    typeof typedObj['target'] === 'string' &&
    typedObj['type'] === 'SET_WALLET' &&
    typeof typedObj['wallet'] === 'string'
  )
}

export function isQueryApplicationRequest(
  obj: unknown
): obj is QueryApplicationRequest {
  const typedObj = obj as QueryApplicationRequest
  return (
    ((typedObj !== null && typeof typedObj === 'object') ||
      typeof typedObj === 'function') &&
    typeof typedObj['target'] === 'string' &&
    typedObj['type'] === 'QUERY' &&
    typeof typedObj['applicationId'] === 'string' &&
    typeof typedObj['query'] === 'string'
  )
}

export function isMutationApplicationRequest(
  obj: unknown
): obj is QueryApplicationRequest {
  const typedObj = obj as MutationApplicationRequest
  return (
    ((typedObj !== null && typeof typedObj === 'object') ||
      typeof typedObj === 'function') &&
    typeof typedObj['target'] === 'string' &&
    typedObj['type'] === 'MUTATION' &&
    typeof typedObj['applicationId'] === 'string' &&
    typeof typedObj['mutation'] === 'string'
  )
}
