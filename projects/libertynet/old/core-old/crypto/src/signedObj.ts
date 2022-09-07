/* eslint-disable */
import { Any } from "./google/protobuf/any";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface SignedObj {
  owner: string;
  pubKey: string;
  version: number;
  seq: number;
  payload: SignedObjPayload[];
}

export interface SignedObjPayload {
  signature: string;
  data: Any | undefined;
}

function createBaseSignedObj(): SignedObj {
  return { owner: "", pubKey: "", version: 0, seq: 0, payload: [] };
}

export const SignedObj = {
  encode(
    message: SignedObj,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.owner !== "") {
      writer.uint32(10).string(message.owner);
    }
    if (message.pubKey !== "") {
      writer.uint32(18).string(message.pubKey);
    }
    if (message.version !== 0) {
      writer.uint32(32).int32(message.version);
    }
    if (message.seq !== 0) {
      writer.uint32(40).int32(message.seq);
    }
    for (const v of message.payload) {
      SignedObjPayload.encode(v!, writer.uint32(82).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignedObj {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignedObj();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.owner = reader.string();
          break;
        case 2:
          message.pubKey = reader.string();
          break;
        case 4:
          message.version = reader.int32();
          break;
        case 5:
          message.seq = reader.int32();
          break;
        case 10:
          message.payload.push(
            SignedObjPayload.decode(reader, reader.uint32())
          );
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SignedObj {
    return {
      owner: isSet(object.owner) ? String(object.owner) : "",
      pubKey: isSet(object.pubKey) ? String(object.pubKey) : "",
      version: isSet(object.version) ? Number(object.version) : 0,
      seq: isSet(object.seq) ? Number(object.seq) : 0,
      payload: Array.isArray(object?.payload)
        ? object.payload.map((e: any) => SignedObjPayload.fromJSON(e))
        : [],
    };
  },

  toJSON(message: SignedObj): unknown {
    const obj: any = {};
    message.owner !== undefined && (obj.owner = message.owner);
    message.pubKey !== undefined && (obj.pubKey = message.pubKey);
    message.version !== undefined &&
      (obj.version = Math.round(message.version));
    message.seq !== undefined && (obj.seq = Math.round(message.seq));
    if (message.payload) {
      obj.payload = message.payload.map((e) =>
        e ? SignedObjPayload.toJSON(e) : undefined
      );
    } else {
      obj.payload = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SignedObj>, I>>(
    object: I
  ): SignedObj {
    const message = createBaseSignedObj();
    message.owner = object.owner ?? "";
    message.pubKey = object.pubKey ?? "";
    message.version = object.version ?? 0;
    message.seq = object.seq ?? 0;
    message.payload =
      object.payload?.map((e) => SignedObjPayload.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSignedObjPayload(): SignedObjPayload {
  return { signature: "", data: undefined };
}

export const SignedObjPayload = {
  encode(
    message: SignedObjPayload,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.signature !== "") {
      writer.uint32(10).string(message.signature);
    }
    if (message.data !== undefined) {
      Any.encode(message.data, writer.uint32(82).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignedObjPayload {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignedObjPayload();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.signature = reader.string();
          break;
        case 10:
          message.data = Any.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SignedObjPayload {
    return {
      signature: isSet(object.signature) ? String(object.signature) : "",
      data: isSet(object.data) ? Any.fromJSON(object.data) : undefined,
    };
  },

  toJSON(message: SignedObjPayload): unknown {
    const obj: any = {};
    message.signature !== undefined && (obj.signature = message.signature);
    message.data !== undefined &&
      (obj.data = message.data ? Any.toJSON(message.data) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SignedObjPayload>, I>>(
    object: I
  ): SignedObjPayload {
    const message = createBaseSignedObjPayload();
    message.signature = object.signature ?? "";
    message.data =
      object.data !== undefined && object.data !== null
        ? Any.fromPartial(object.data)
        : undefined;
    return message;
  },
};

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & Record<
        Exclude<keyof I, KeysOfUnion<P>>,
        never
      >;

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
