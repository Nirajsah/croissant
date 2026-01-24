// To parse this
//
//   import { Convert, Wallet } from "./file";
//
//   const wallet = Convert.toWallet(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

// Branded type for ChainId to ensure type safety
//

// To parse this data:
//
//   import { Convert, Wallet } from "./file";
//
//   const wallet = Convert.toWallet(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.
export type ChainId = string & { readonly __brand: 'ChainId' }

export interface Chains {
  [key: string]: ChainInfo
}

export interface Wallet {
  chains: Chains
  default: ChainId
}

export interface ChainInfo {
  blockHash: null | string
  epoch: string
  nextBlockHeight: number
  owner: string
  pendingProposal: null | string
  timestamp: number
}

export type ChainEntry = {
  chainId: ChainId
  chainInfo: ChainInfo
}

export type WalletChainList = {
  default: ChainId
  chains: ChainEntry[]
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toWallet(json: string): Wallet {
    return cast(JSON.parse(json), r('Wallet'))
  }
  public static chainsAsList(json: string): WalletChainList {
    const wallet = this.toWallet(json)

    const chains: ChainEntry[] = Object.entries(wallet.chains).map(
      ([id, info]) => ({
        chainId: id.toLowerCase() as ChainId,
        chainInfo: info,
      })
    )

    return {
      default: wallet.default as ChainId,
      chains,
    }
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ)
  const parentText = parent ? ` on ${parent}` : ''
  const keyText = key ? ` for key "${key}"` : ''
  throw Error(
    `Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`
  )
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`
    } else {
      return `one of [${typ
        .map((a) => {
          return prettyTypeName(a)
        })
        .join(', ')}]`
    }
  } else if (typeof typ === 'object' && typ.literal !== undefined) {
    return typ.literal
  } else {
    return typeof typ
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }))
    typ.jsonToJS = map
  }
  return typ.jsonToJS
}

function transform(
  val: any,
  typ: any,
  getProps: any,
  key: any = '',
  parent: any = ''
): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val
    return invalidValue(typ, val, key, parent)
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length
    for (let i = 0; i < l; i++) {
      const typ = typs[i]
      try {
        return transform(val, typ, getProps)
      } catch (_) { }
    }
    return invalidValue(typs, val, key, parent)
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val
    return invalidValue(
      cases.map((a) => {
        return l(a)
      }),
      val,
      key,
      parent
    )
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l('array'), val, key, parent)
    return val.map((el) => transform(el, typ, getProps))
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null
    }
    const d = new Date(val)
    if (isNaN(d.valueOf())) {
      return invalidValue(l('Date'), val, key, parent)
    }
    return d
  }

  function transformObject(
    props: { [k: string]: any },
    additional: any,
    val: any
  ): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue(l(ref || 'object'), val, key, parent)
    }
    const result: any = {}
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key]
      const v = Object.prototype.hasOwnProperty.call(val, key)
        ? val[key]
        : undefined
      result[prop.key] = transform(v, prop.typ, getProps, key, ref)
    })
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref)
      }
    })
    return result
  }

  if (typ === 'any') return val
  if (typ === null) {
    if (val === null) return val
    return invalidValue(typ, val, key, parent)
  }
  if (typ === false) return invalidValue(typ, val, key, parent)
  let ref: any = undefined
  while (typeof typ === 'object' && typ.ref !== undefined) {
    ref = typ.ref
    typ = typeMap[typ.ref]
  }
  if (Array.isArray(typ)) return transformEnum(typ, val)
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
        ? transformArray(typ.arrayItems, val)
        : typ.hasOwnProperty('props')
          ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent)
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') return transformDate(val)
  return transformPrimitive(typ, val)
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps)
}

function l(typ: any) {
  return { literal: typ }
}

function u(...typs: any[]) {
  return { unionMembers: typs }
}

function o(props: any[], additional: any) {
  return { props, additional }
}

function m(additional: any) {
  return { props: [], additional }
}

function r(name: string) {
  return { ref: name }
}

const typeMap: any = {
  Wallet: o(
    [
      { json: 'chains', js: 'chains', typ: r('Chains') },
      { json: 'default', js: 'default', typ: '' },
    ],
    false
  ),

  // *** fix: accept arbitrary chainId keys ***
  Chains: m(r('ChainInfo')), // "map of string -> ChainInfo"

  // *** fix: convert snake_case to camelCase ***
  ChainInfo: o(
    [
      { json: 'block_hash', js: 'blockHash', typ: u(null, '') },
      { json: 'epoch', js: 'epoch', typ: '' },
      { json: 'next_block_height', js: 'nextBlockHeight', typ: 0 },
      { json: 'owner', js: 'owner', typ: '' },
      { json: 'pending_proposal', js: 'pendingProposal', typ: u(null, '') },
      { json: 'timestamp', js: 'timestamp', typ: 0 },
    ],
    false
  ),
}