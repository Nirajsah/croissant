// To parse this data:
//
//   import { Convert, Wallet } from "./file";
//
//   const wallet = Convert.toWallet(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Wallet {
    chains:               { [key: string]: ChainValue };
    unassigned_key_pairs: UnassignedKeyPairs;
    default:              string;
    genesis_config:       GenesisConfig;
    testing_prng_seed:    null;
}

export interface ChainValue {
    chain_id:          string;
    key_pair:          KeyPair;
    block_hash:        null | string;
    timestamp:         number;
    next_block_height: number;
    pending_proposal:  null;
}

export interface KeyPair {
    Ed25519: string;
}

export interface GenesisConfig {
    committee:    Committee;
    admin_id:     string;
    timestamp:    number;
    chains:       Array<Array<KeyPair | string>>;
    policy:       Policy;
    network_name: string;
}

export interface Committee {
    validators: Validator[];
}

export interface Validator {
    public_key:  string;
    account_key: KeyPair;
    network:     Network;
}

export interface Network {
    protocol: Protocol;
    host:     string;
    port:     number;
}

export interface Protocol {
    Grpc: string;
}

export interface Policy {
    block:                               string;
    fuel_unit:                           string;
    read_operation:                      string;
    write_operation:                     string;
    byte_read:                           string;
    byte_written:                        string;
    blob_read:                           string;
    blob_published:                      string;
    blob_byte_read:                      string;
    blob_byte_published:                 string;
    byte_stored:                         string;
    operation:                           string;
    operation_byte:                      string;
    message:                             string;
    message_byte:                        string;
    service_as_oracle_query:             string;
    http_request:                        string;
    maximum_fuel_per_block:              number;
    maximum_service_oracle_execution_ms: number;
    maximum_block_size:                  number;
    maximum_bytecode_size:               number;
    maximum_blob_size:                   number;
    maximum_published_blobs:             number;
    maximum_block_proposal_size:         number;
    maximum_bytes_read_per_block:        number;
    maximum_bytes_written_per_block:     number;
    maximum_oracle_response_bytes:       number;
    maximum_http_response_bytes:         number;
    http_request_timeout_ms:             number;
    http_request_allow_list:             string[];
}

export interface UnassignedKeyPairs {
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toWallet(json: string): Wallet {
        return cast(JSON.parse(json), r("Wallet"));
    }

    public static walletToJson(value: Wallet): string {
        return JSON.stringify(uncast(value, r("Wallet")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Wallet": o([
        { json: "chains", js: "chains", typ: m(r("ChainValue")) },
        { json: "unassigned_key_pairs", js: "unassigned_key_pairs", typ: r("UnassignedKeyPairs") },
        { json: "default", js: "default", typ: "" },
        { json: "genesis_config", js: "genesis_config", typ: r("GenesisConfig") },
        { json: "testing_prng_seed", js: "testing_prng_seed", typ: null },
    ], false),
    "ChainValue": o([
        { json: "chain_id", js: "chain_id", typ: "" },
        { json: "key_pair", js: "key_pair", typ: r("KeyPair") },
        { json: "block_hash", js: "block_hash", typ: u(null, "") },
        { json: "timestamp", js: "timestamp", typ: 0 },
        { json: "next_block_height", js: "next_block_height", typ: 0 },
        { json: "pending_proposal", js: "pending_proposal", typ: null },
    ], false),
    "KeyPair": o([
        { json: "Ed25519", js: "Ed25519", typ: "" },
    ], false),
    "GenesisConfig": o([
        { json: "committee", js: "committee", typ: r("Committee") },
        { json: "admin_id", js: "admin_id", typ: "" },
        { json: "timestamp", js: "timestamp", typ: 0 },
        { json: "chains", js: "chains", typ: a(a(u(r("KeyPair"), ""))) },
        { json: "policy", js: "policy", typ: r("Policy") },
        { json: "network_name", js: "network_name", typ: "" },
    ], false),
    "Committee": o([
        { json: "validators", js: "validators", typ: a(r("Validator")) },
    ], false),
    "Validator": o([
        { json: "public_key", js: "public_key", typ: "" },
        { json: "account_key", js: "account_key", typ: r("KeyPair") },
        { json: "network", js: "network", typ: r("Network") },
    ], false),
    "Network": o([
        { json: "protocol", js: "protocol", typ: r("Protocol") },
        { json: "host", js: "host", typ: "" },
        { json: "port", js: "port", typ: 0 },
    ], false),
    "Protocol": o([
        { json: "Grpc", js: "Grpc", typ: "" },
    ], false),
    "Policy": o([
        { json: "block", js: "block", typ: "" },
        { json: "fuel_unit", js: "fuel_unit", typ: "" },
        { json: "read_operation", js: "read_operation", typ: "" },
        { json: "write_operation", js: "write_operation", typ: "" },
        { json: "byte_read", js: "byte_read", typ: "" },
        { json: "byte_written", js: "byte_written", typ: "" },
        { json: "blob_read", js: "blob_read", typ: "" },
        { json: "blob_published", js: "blob_published", typ: "" },
        { json: "blob_byte_read", js: "blob_byte_read", typ: "" },
        { json: "blob_byte_published", js: "blob_byte_published", typ: "" },
        { json: "byte_stored", js: "byte_stored", typ: "" },
        { json: "operation", js: "operation", typ: "" },
        { json: "operation_byte", js: "operation_byte", typ: "" },
        { json: "message", js: "message", typ: "" },
        { json: "message_byte", js: "message_byte", typ: "" },
        { json: "service_as_oracle_query", js: "service_as_oracle_query", typ: "" },
        { json: "http_request", js: "http_request", typ: "" },
        { json: "maximum_fuel_per_block", js: "maximum_fuel_per_block", typ: 3.14 },
        { json: "maximum_service_oracle_execution_ms", js: "maximum_service_oracle_execution_ms", typ: 3.14 },
        { json: "maximum_block_size", js: "maximum_block_size", typ: 3.14 },
        { json: "maximum_bytecode_size", js: "maximum_bytecode_size", typ: 3.14 },
        { json: "maximum_blob_size", js: "maximum_blob_size", typ: 3.14 },
        { json: "maximum_published_blobs", js: "maximum_published_blobs", typ: 3.14 },
        { json: "maximum_block_proposal_size", js: "maximum_block_proposal_size", typ: 3.14 },
        { json: "maximum_bytes_read_per_block", js: "maximum_bytes_read_per_block", typ: 3.14 },
        { json: "maximum_bytes_written_per_block", js: "maximum_bytes_written_per_block", typ: 3.14 },
        { json: "maximum_oracle_response_bytes", js: "maximum_oracle_response_bytes", typ: 3.14 },
        { json: "maximum_http_response_bytes", js: "maximum_http_response_bytes", typ: 3.14 },
        { json: "http_request_timeout_ms", js: "http_request_timeout_ms", typ: 3.14 },
        { json: "http_request_allow_list", js: "http_request_allow_list", typ: a("") },
    ], false),
    "UnassignedKeyPairs": o([
    ], false),
};
