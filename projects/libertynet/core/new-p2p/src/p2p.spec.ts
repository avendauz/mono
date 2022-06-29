import {
    P2p,
    P2pAddHandlerMsg,
    P2pCreatedMsg,
    P2pCreateMsg,
    P2pDialPeerMsg,
    P2pDialSuccessMsg,
    P2pHandlerAddedMsg,
    P2pSendToStreamMsg,
    P2pStartedMsg,
    P2pStartMsg,
    P2pStopMsg,
    P2pStoppedMsg
} from "./p2p";
import {eventListener, getCentralMsgBus, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {concatMap, first, from, switchMap, take, tap, timer, toArray, range, delay} from "rxjs";
import {TextDecoder} from "util";
import {expect} from 'chai'
import './p2pLogger'
import {describe, it} from 'mocha'


//getCentralMsgBus().subscribe(console.log);

describe('p2p', function() {
    this.timeout(30_000)
    it('should be able to send messages between p2ps', (done) => {
        let p2ps: P2p[] = [];

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            take(2),
            toArray(),
        ).subscribe(n => p2ps = n);


        sendEvent<P2pCreateMsg>('p2p.create', {p2pPort: 10010, rpcPort: 10050, bootstrapers: []});

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            first(),
            tap(p2p => sendEvent<P2pCreateMsg>('p2p.create', {p2pPort: 10011, rpcPort: 10051, bootstrapers: [p2p.libp2p.getMultiaddrs()[0].toString()]}))
        ).subscribe()

        eventListener<P2pCreatedMsg>('p2p.created').pipe(
            tap(p2p => sendEvent<P2pAddHandlerMsg>("p2p.add-handler", {
                p2p,
                protocol:'/chat/1.0.0',
                handler: x => timer(0).pipe(
                    tap(() => expect(new TextDecoder().decode(x) === 'Hello\n')),
                    switchMap(() => from(p2ps)),
                    tap(sendEventPartial<P2pStopMsg>('p2p.stop')),
                    concatMap(() => eventListener<P2pStoppedMsg>('p2p.stopped')),
                    tap(() => done())
                ).subscribe()
            })),
            concatMap(() => eventListener<P2pHandlerAddedMsg>('p2p.handlerAdded')),
            take(2),
            tap(({p2p}) => sendEvent<P2pStartMsg>('p2p.start', p2p))
        ).subscribe()

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            take(2),
            toArray(),
            tap(p2ps => sendEvent<P2pDialPeerMsg>('p2p.dial-peer', {
                p2p: p2ps[0],
                peerAddr: p2ps[1].libp2p.getMultiaddrs()[0].toString(),
                protocol: '/chat/1.0.0'
            })),
            concatMap(() => eventListener<P2pDialSuccessMsg>('p2p.dial-success')),
            tap(({writer}) => sendEvent<P2pSendToStreamMsg>('p2p.send-to-stream', {writer, data: new TextEncoder().encode('Hello\n')})),
        ).subscribe()
    });

    it('should allow peer discovery', (done) => {
        // create root p2p
        sendEvent<P2pCreateMsg>('p2p.create', {
            p2pPort: 10010,
            rpcPort: 10050,
            bootstrapers: []
        });

        eventListener<P2pCreatedMsg>('p2p.created').pipe(
            tap(p2p => sendEvent<P2pStartMsg>('p2p.start', p2p))
        ).subscribe()

        // create other p2ps
        eventListener<P2pStartedMsg>('p2p.started').pipe(
            first(),
            switchMap(p2p => range(1, 4).pipe(
                tap(offset => sendEvent<P2pCreateMsg>('p2p.create', {
                    p2pPort: 10010 + offset,
                    rpcPort: 10050 + offset,
                    bootstrapers: [p2p.libp2p.getMultiaddrs()[0].toString()]
                }))
            ))
        ).subscribe();

        // collect up all p2ps
        eventListener<P2pStartedMsg>('p2p.started').pipe(
            take(5),
            delay(5_000),
            tap(p2p => setTimeout(() => sendEvent<P2pStopMsg>('p2p.stop', p2p), 1000)),
            concatMap(p2p => p2p.libp2p.getPeers()),
            toArray(),
            tap((peers) => expect(peers.length).to.equal(8)),
            tap(() => done())
        ).subscribe()
    });

})