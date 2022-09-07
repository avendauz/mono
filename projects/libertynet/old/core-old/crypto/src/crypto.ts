import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {map, of, pipe, switchMap, tap, from, reduce, filter, first, takeUntil, concatMap} from 'rxjs'
import * as ed from '@noble/ed25519';
import {pad} from "lodash";
import {bech32} from 'bech32'
import {SignedObj} from "./signedObj";
import {AppStopMsg} from 'projects/libertynet/core/old/app'
import {NewLibertynetMessageMsg, SendLibertynetMessageAction} from 'projects/libertynet/core/old/iota-connector'
import {AccountExistsMsg, EnsureAccountExistsAction} from "projects/libertynet/core/old/accounts";

export type SendSignedObjMessageAction = Msg<'send-signed-obj-message', {
    username: string
    password: string
    typeUrl: string
    data: Uint8Array
}>


export type NewSignedObjMsg = Msg<'new-signed-obj', SignedObj>
export type NewValidSignedObjMsg = Msg<'new-valid-signed-obj', SignedObj>
export type NewInvalidSignedObjMsg = Msg<'new-invalid-signed-obj', SignedObj>

export const createPrivateKey = () => pipe(
    map(({username, password}) => `${username}${password}`),
    map(s => s.slice(0, 32)),
    map(s => pad(s, 32, ' ')),
    map(s => new TextEncoder().encode(s)),
    map(b => Buffer.from(b).toString('hex'))
);


export const encodeSignedObj = () => pipe(
    map((input: { username: string, password: string, data: Uint8Array, typeUrl: string}) => input),
    concatMap(({username, password, data, typeUrl}) => of({username, password}).pipe(
        createPrivateKey(),
        map(privateKey => ({privateKey, data, typeUrl}))
    )),
    concatMap(({data, privateKey, typeUrl}) => of(privateKey).pipe(
        tap(x => x),
        getPublicKey(),
        map(pubKey => ({data, typeUrl, pubKey, privateKey}))
    )),
    concatMap(({data, typeUrl, pubKey, privateKey}) => of(pubKey).pipe(
        getAddress(),
        map(addr => ({addr, data, typeUrl, pubKey, privateKey}))
    )),
    concatMap(({addr, data, typeUrl, pubKey, privateKey}) => of({pubKey, address: addr}).pipe(
        getSendSeq(),
        map(seq => ({privateKey, data, typeUrl, addr, pubKey, seq}))
    )),
    concatMap(({privateKey, data, typeUrl, addr, pubKey, seq}) => of({privateKey, data}).pipe(
        signData(),
        map(sig => ({sig, data, typeUrl, addr, pubKey, seq}))
    )),
    map(({addr, sig, data, typeUrl, pubKey, seq}) =>
        SignedObj.encode({
            payload: [{signature: sig, data: {typeUrl: typeUrl, value: data}}],
            pubKey,
            owner: addr,
            version: 1,
            seq
        })
    ),
    map(writer => writer.finish())
)

const getSendSeq = () => pipe(
    switchMap(({pubKey, address}: {pubKey: string, address: string}) => of(0))
);

export const decodeSignedObj = () => pipe(
    map((input: Uint8Array) => SignedObj.decode(input)),
)

export const verifySignedObj = () => pipe(
    concatMap(({signedObj, pubKey}: { signedObj: SignedObj, pubKey: string }) =>
        from(signedObj.payload).pipe(
            map(payload => ({signedObj, payload, pubKey})),
            concatMap(({signedObj, payload, pubKey}) =>
                ed.verify(payload.signature, payload.data?.value as Uint8Array, pubKey)
                    .then(isValid => ({isValid, signedObj}))
            ),
            reduce((acc, curr) => ({isValid: curr.isValid && acc.isValid, signedObj: curr.signedObj}), {
                isValid: true,
                signedObj: {} as SignedObj
            })
        )
    ),
);


export const getAddress = () => pipe(
    map((pubKey: string) => bech32.toWords(Buffer.from(pubKey, 'hex'))),
    map(pubKey => bech32.encode('liberty', pubKey))
)

export const getPublicKey = () => pipe(
    switchMap(ed.getPublicKey),
    map(ed.utils.bytesToHex)
);

export const signData = () =>
    pipe(
        map(({privateKey, data}) => ({privateKey, data: ed.utils.bytesToHex(data)})),
        switchMap(({privateKey, data}) => ed.sign(data, privateKey)),
        map(ed.utils.bytesToHex)
    );


export const verifySig = () => pipe(
    switchMap(({data, sig, pubKey}) => ed.verify(sig, data, pubKey))
);

eventListener<NewLibertynetMessageMsg>('new-libertynet-message').pipe(
    takeUntil(eventListener<AppStopMsg>('app-stop')),
    map(hex => Buffer.from(hex, 'hex')),
    decodeSignedObj(),
    tap(sendEventPartial<NewSignedObjMsg>('new-signed-obj'))
).subscribe();

eventListener<SendSignedObjMessageAction>('send-signed-obj-message').pipe(
    takeUntil(eventListener<AppStopMsg>('app-stop')),
    encodeSignedObj(),
    map(bytes => Buffer.from(bytes).toString("hex")),
    tap(sendEventPartial<SendLibertynetMessageAction>('send-libertynet-message'))
).subscribe();

eventListener<NewSignedObjMsg>('new-signed-obj').pipe(
    takeUntil(eventListener<AppStopMsg>('app-stop')),
    tap((signedObj) => sendEvent<EnsureAccountExistsAction>('ensure-account-exists', {
        address: signedObj.owner,
        pubKey: signedObj.pubKey
    })),
    concatMap((signedObj) => eventListener<AccountExistsMsg>('account-exists').pipe(
        filter(({address}) => address === signedObj.owner),
        first(),
        map((account) => ({signedObj, account}))
    )),
    map(({signedObj, account}) => ({signedObj, pubKey: account.pubKey})),
    verifySignedObj(),
    tap(({isValid, signedObj}) => isValid ? (
        sendEvent<NewValidSignedObjMsg>('new-valid-signed-obj', signedObj)
    ) : (
        sendEvent<NewInvalidSignedObjMsg>('new-invalid-signed-obj', signedObj)
    ))
).subscribe();






