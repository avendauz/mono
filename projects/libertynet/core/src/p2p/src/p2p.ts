import {createLibp2p, Libp2p} from 'libp2p'
import {TCP} from '@libp2p/tcp'
import {Noise} from '@chainsafe/libp2p-noise'
import {concatMap, map, switchMap, takeUntil, tap} from "rxjs";
import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {Multiaddr} from "@multiformats/multiaddr";
import {StreamHandler} from '@libp2p/interface-registrar'
import {Mplex} from "@libp2p/mplex";
import {pipe} from "it-pipe";
import type {Stream} from '@libp2p/interface-connection'
import {Readable, pipeline} from "stream";
import {Bootstrap} from "@libp2p/bootstrap";
import {MulticastDNS} from "@libp2p/mdns";
import {AppStartMsg} from "../../app/src/app";
import {GossipSub} from "@chainsafe/libp2p-gossipsub";
import {PubSubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";

export type P2p = {
    libp2p: Libp2p,
    p2pId: string,
    moniker: string
}

export type P2pConfig = {
    p2pPort: number,
    rpcPort: number,
    bootstrapers: MultiAddrStr[]
    moniker: string
}

export type MultiAddrStr = string

export type P2pCreateMsg = Msg<'p2p.create', P2pConfig>
export type P2pCreatedMsg = Msg<'p2p.created', P2p>
export type P2pStartMsg = Msg<'p2p.start', P2p>
export type P2pStartedMsg = Msg<'p2p.started', P2p>
export type P2pDialPeerMsg = Msg<'p2p.dial-peer', { p2p: P2p, peerAddr: string, protocol: string }>
export type P2pDialSuccessMsg = Msg<'p2p.dial-success', { p2p: P2p, peerAddr: string, protocol: string, stream: Stream, writer: (data: Uint8Array) => void }>
export type P2pSendToStreamMsg = Msg<'p2p.send-to-stream', { writer: (data: Uint8Array) => void, data: Uint8Array }>
export type P2pAddHandlerMsg = Msg<'p2p.add-handler', { p2p: P2p, protocol: string, handler: (data: Uint8Array) => void }>
export type P2pHandlerAddedMsg = Msg<'p2p.handlerAdded', { p2p: P2p, protocol: string }>
export type P2pStopMsg = Msg<'p2p.stop', P2p>
export type P2pStoppedMsg = Msg<'p2p.stopped', P2p>
export type P2pPeerDiscoveredMsg = Msg<'p2p.peer-discovered', { p2p: P2p, peerId: string }>
export type P2pPublishMsg = Msg<'p2p.publish', { p2p: P2p, topic: string, msg: Uint8Array }>
export type P2pSubscribeMsg = Msg<'p2p.subscribe', { p2p: P2p, topic: string }>
export type P2pMessageMsg = Msg<'p2p.message', { topic: string, msg: Uint8Array }>

// TODO: Test pubsub

eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pPublishMsg>('p2p.publish').pipe(
        takeUntil(eventListener('app.stop'))
    )),
    tap(({p2p, topic, msg}) => p2p.libp2p.pubsub.publish(topic, msg))
).subscribe();


eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pSubscribeMsg>('p2p.subscribe').pipe(
        takeUntil(eventListener('app.stop'))
    )),
    tap(({p2p, topic}) => {
        p2p.libp2p.pubsub.subscribe(topic);
        // TODO: Validate signature of incoming message
        p2p.libp2p.pubsub.addEventListener('message', (msg) => sendEvent<P2pMessageMsg>('p2p.message', {
            topic: msg.detail.topic,
            msg: msg.detail.data
        }))
    }),
).subscribe();


eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pCreateMsg>('p2p.create').pipe(
        takeUntil(eventListener('app.stop'))
    )),
    concatMap(({p2pPort, bootstrapers, moniker}) => createLibp2p({
            transports: [new TCP()],
            connectionEncryption: [new Noise()],
            streamMuxers: [new Mplex()],
            peerDiscovery: [
                new PubSubPeerDiscovery(),
                new MulticastDNS(),
                ...(bootstrapers?.length ? [new Bootstrap({
                    interval: 60e3,
                    list: bootstrapers
                })] : [])
            ],
            addresses: {
                listen: [`/ip4/0.0.0.0/tcp/${p2pPort}`]
            },
            pubsub: new GossipSub(),

        }).then(libp2p => ({libp2p, moniker}))
    ),
    map(({libp2p, moniker}) => ({
        libp2p,
        p2pId: libp2p.peerId.toString(),
        moniker
    })),
    tap(sendEventPartial<P2pCreatedMsg>('p2p.created'))
).subscribe();

eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pCreatedMsg>('p2p.created').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    tap(p2p => p2p.libp2p.addEventListener('peer:discovery', ev => sendEvent<P2pPeerDiscoveredMsg>('p2p.peer-discovered', {
        p2p,
        peerId: ev.detail.id.toString()
    })))
).subscribe()

eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pStopMsg>('p2p.stop').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    concatMap(p2p => (p2p.libp2p.stop() || Promise.resolve()).then(() => p2p)),
    tap(sendEventPartial<P2pStoppedMsg>('p2p.stopped'))
).subscribe()

eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pStartMsg>('p2p.start').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    concatMap(p2p => (p2p.libp2p.start() || Promise.resolve(p2p)).then(() => p2p)),
    tap(sendEventPartial<P2pStartedMsg>('p2p.started'))
).subscribe();


eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pAddHandlerMsg>('p2p.add-handler').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    concatMap(({p2p, protocol, handler}) => p2p.libp2p.handle(protocol, streamHandler(handler)).then(() => ({
        p2p,
        protocol
    }))),
    tap(sendEventPartial<P2pHandlerAddedMsg>('p2p.handlerAdded'))
).subscribe()

eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pDialPeerMsg>('p2p.dial-peer').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    concatMap(({
                   p2p,
                   peerAddr,
                   protocol
               }) => p2p.libp2p.dialProtocol(new Multiaddr(peerAddr), protocol).then(stream => ({
        p2p,
        stream,
        peerAddr,
        protocol
    }))),
    concatMap(({p2p, stream, peerAddr, protocol}) => setupStreamWriter(stream).then(writer => ({
        writer,
        p2p,
        stream,
        peerAddr,
        protocol
    }))),
    tap(sendEventPartial<P2pDialSuccessMsg>('p2p.dial-success'))
).subscribe()


eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<P2pSendToStreamMsg>('p2p.send-to-stream').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    tap(({writer, data}) => writer(data))
).subscribe()

const streamHandler = (handler: (data: Uint8Array) => void): StreamHandler => ({stream}) => {
    pipe(
        stream.source,
        async function (source) {
            for await (const msg of source) {
                handler(msg.subarray())
            }
        }
    )
}

export const setupStreamWriter = (stream: Stream) => {

    const source = new Readable({
        read() {
        }
    })
    pipeline(
        source,
        stream.sink,
        err => console.log('************************ ERROR', err)
    )
    return Promise.resolve().then(
        () => (data: Uint8Array) => source.push(data)
    )
}

