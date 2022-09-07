import {eventListener, Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {DagMessage} from "./dagMessage";
import {tap, filter, concatMap, from, switchMap, of, map, takeUntil} from 'rxjs'
import {createHash} from "crypto";
import {addProp} from "@scottburch/rxjs-utils";
import {AppStartMsg, AppStopMsg} from "../../app/src/app";


type DagMessageMetaWrapperLocal = {
    msg: DagMessage,
    source: 'local',
    isSolid: boolean
}

type DagMessageMetaWrapperPeer = {
    msg: DagMessage,
    source: 'peer'
}

export type DagMessageMetaWrapper = DagMessageMetaWrapperPeer | DagMessageMetaWrapperLocal

export type DagValidMessageReceived = Msg<'dag.valid-message-received', DagMessageMetaWrapper>
export type DagInvalidMessageReceived = Msg<'dag.invalid-message-received', DagMessageMetaWrapper>
export type DagMessageReceived = Msg<'dag.message-received', DagMessageMetaWrapper>
export type DagRequestMessage = Msg<'dag.request-message', { id: Uint8Array, source: 'peers' | 'local' }>


// retrive parent messages for any message that is received from a peer
eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<DagValidMessageReceived>('dag.valid-message-received').pipe(
        takeUntil(eventListener<AppStopMsg>('app.stop'))
    )),
    filter(({source}) => source === 'peer'),
    concatMap(({msg}) => from(msg.parentIds)),
    tap(parentId => sendEvent<DagRequestMessage>('dag.request-message', {id: parentId, source: 'local'}))
).subscribe();


// validate received messages
eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<DagMessageReceived>('dag.message-received').pipe(
        takeUntil(eventListener<AppStopMsg>('app.stop'))
    )),
    filter(({source}) => source === 'peer'),
    switchMap(wrapper => validateMsg(wrapper.msg).pipe(
        map(isValid => ({wrapper, isValid}))
    )),
    tap(({isValid, wrapper}) => isValid ? (
        sendEvent<DagValidMessageReceived>('dag.valid-message-received', wrapper)
    ) : (
        sendEvent<DagInvalidMessageReceived>('dag.invalid-message-received', wrapper)
    ))
).subscribe()

export const newDagMessage = (msg: Omit<DagMessage, 'id'>) => of(msg).pipe(
    switchMap(msg => calculateMsgHash(msg).pipe(addProp(msg, 'id')))
)

export const validateMsg = (msg: DagMessage) => of(msg).pipe(
    switchMap(msg => calculateMsgHash(msg).pipe(
        map(hash => Buffer.from(hash).equals(msg.id))
    ))
);


export const calculateMsgHash = (msg: DagMessage | Omit<DagMessage, 'id'>) => of(msg).pipe(
    map(() => new Uint8Array([
        ...msg.payload,
        ...concatParentIds(msg.parentIds),
        ...numToInt32(msg.sequence),
        ...(msg.sig?.pubKey || []),
        ...(msg.sig?.signature || [])
    ])),
    map(buf => createHash('sha256').update(buf).digest()),
    map(buf => Uint8Array.from(buf))
);

const concatParentIds = (parentIds: Uint8Array[]) => new Uint8Array(
    parentIds.reduce((combined, parentId) => [...combined, ...parentId], [] as number[])
)


export const numToInt32 = (num: number) => {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setUint32(0, num, false);
    return new Uint8Array(buf, 0, 4);
};

export const toHex = (buf: Uint8Array) => Buffer.from(buf).toString('hex')


