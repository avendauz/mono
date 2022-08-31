/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Timestamp } from "./google/protobuf/timestamp";

export const protobufPackage = "";

export interface DagMessage {
  id: Uint8Array;
  version: number;
  type: string;
  sig: Signature | undefined;
  payload: Uint8Array;
  parentIds: Uint8Array[];
  timestamp: Date | undefined;
  sequence: number;
}

export interface Signature {
  pubKey: Uint8Array;
  signature: Uint8Array;
}

function createBaseDagMessage(): DagMessage {
  return {
    id: new Uint8Array(),
    version: 0,
    type: "",
    sig: undefined,
    payload: new Uint8Array(),
    parentIds: [],
    timestamp: undefined,
    sequence: 0,
  };
}

export const DagMessage = {
  encode(message: DagMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id.length !== 0) {
      writer.uint32(10).bytes(message.id);
    }
    if (message.version !== 0) {
      writer.uint32(16).int32(message.version);
    }
    if (message.type !== "") {
      writer.uint32(26).string(message.type);
    }
    if (message.sig !== undefined) {
      Signature.encode(message.sig, writer.uint32(34).fork()).ldelim();
    }
    if (message.payload.length !== 0) {
      writer.uint32(42).bytes(message.payload);
    }
    for (const v of message.parentIds) {
      writer.uint32(50).bytes(v!);
    }
    if (message.timestamp !== undefined) {
      Timestamp.encode(toTimestamp(message.timestamp), writer.uint32(58).fork()).ldelim();
    }
    if (message.sequence !== 0) {
      writer.uint32(64).uint64(message.sequence);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DagMessage {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDagMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.bytes();
          break;
        case 2:
          message.version = reader.int32();
          break;
        case 3:
          message.type = reader.string();
          break;
        case 4:
          message.sig = Signature.decode(reader, reader.uint32());
          break;
        case 5:
          message.payload = reader.bytes();
          break;
        case 6:
          message.parentIds.push(reader.bytes());
          break;
        case 7:
          message.timestamp = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          break;
        case 8:
          message.sequence = longToNumber(reader.uint64() as Long);
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): DagMessage {
    return {
      id: isSet(object.id) ? bytesFromBase64(object.id) : new Uint8Array(),
      version: isSet(object.version) ? Number(object.version) : 0,
      type: isSet(object.type) ? String(object.type) : "",
      sig: isSet(object.sig) ? Signature.fromJSON(object.sig) : undefined,
      payload: isSet(object.payload) ? bytesFromBase64(object.payload) : new Uint8Array(),
      parentIds: Array.isArray(object?.parentIds) ? object.parentIds.map((e: any) => bytesFromBase64(e)) : [],
      timestamp: isSet(object.timestamp) ? fromJsonTimestamp(object.timestamp) : undefined,
      sequence: isSet(object.sequence) ? Number(object.sequence) : 0,
    };
  },

  toJSON(message: DagMessage): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = base64FromBytes(message.id !== undefined ? message.id : new Uint8Array()));
    message.version !== undefined && (obj.version = Math.round(message.version));
    message.type !== undefined && (obj.type = message.type);
    message.sig !== undefined && (obj.sig = message.sig ? Signature.toJSON(message.sig) : undefined);
    message.payload !== undefined
      && (obj.payload = base64FromBytes(message.payload !== undefined ? message.payload : new Uint8Array()));
    if (message.parentIds) {
      obj.parentIds = message.parentIds.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.parentIds = [];
    }
    message.timestamp !== undefined && (obj.timestamp = message.timestamp.toISOString());
    message.sequence !== undefined && (obj.sequence = Math.round(message.sequence));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DagMessage>, I>>(object: I): DagMessage {
    const message = createBaseDagMessage();
    message.id = object.id ?? new Uint8Array();
    message.version = object.version ?? 0;
    message.type = object.type ?? "";
    message.sig = (object.sig !== undefined && object.sig !== null) ? Signature.fromPartial(object.sig) : undefined;
    message.payload = object.payload ?? new Uint8Array();
    message.parentIds = object.parentIds?.map((e) => e) || [];
    message.timestamp = object.timestamp ?? undefined;
    message.sequence = object.sequence ?? 0;
    return message;
  },
};

function createBaseSignature(): Signature {
  return { pubKey: new Uint8Array(), signature: new Uint8Array() };
}

export const Signature = {
  encode(message: Signature, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pubKey.length !== 0) {
      writer.uint32(10).bytes(message.pubKey);
    }
    if (message.signature.length !== 0) {
      writer.uint32(18).bytes(message.signature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Signature {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignature();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.pubKey = reader.bytes();
          break;
        case 2:
          message.signature = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Signature {
    return {
      pubKey: isSet(object.pubKey) ? bytesFromBase64(object.pubKey) : new Uint8Array(),
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
    };
  },

  toJSON(message: Signature): unknown {
    const obj: any = {};
    message.pubKey !== undefined
      && (obj.pubKey = base64FromBytes(message.pubKey !== undefined ? message.pubKey : new Uint8Array()));
    message.signature !== undefined
      && (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Signature>, I>>(object: I): Signature {
    const message = createBaseSignature();
    message.pubKey = object.pubKey ?? new Uint8Array();
    message.signature = object.signature ?? new Uint8Array();
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function toTimestamp(date: Date): Timestamp {
  const seconds = date.getTime() / 1_000;
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = t.seconds * 1_000;
  millis += t.nanos / 1_000_000;
  return new Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof Date) {
    return o;
  } else if (typeof o === "string") {
    return new Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
