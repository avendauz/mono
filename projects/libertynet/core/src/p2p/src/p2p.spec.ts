import {
    eventListener,
    eventListenerOnce,
    getCentralMsgBus,
    sendEvent,
    sendEventPartial
} from "@scottburch/rxjs-msg-bus";
import {concatMap, first, from, switchMap, take, tap, timer, toArray, range, delay} from "rxjs";
import {TextDecoder} from "util";
import {expect} from 'chai'
import './p2plogger'
import {describe, it} from 'mocha'
import {
    P2p,
    P2pAddHandlerMsg,
    P2pCreatedMsg,
    P2pCreateMsg,
    P2pDialPeerMsg,
    P2pDialSuccessMsg, P2pHandlerAddedMsg, P2pMessageMsg, P2pPublishMsg, P2pSendToStreamMsg,
    P2pStartedMsg,
    P2pStartMsg, P2pStopMsg, P2pStoppedMsg, P2pSubscribeMsg
} from "./p2p";
import {AppStartedMsg, AppStoppedMsg, AppStartMsg, AppStopMsg} from "../../app/src/app";


getCentralMsgBus().subscribe(ev => console.log(new Date().toISOString(), ev));

describe('p2p', function() {
    this.timeout(30_000);

    beforeEach(done => {
        sendEvent<AppStartMsg>('app.start');
        eventListenerOnce<AppStartedMsg>('app.started').subscribe(() => done())
    });

    afterEach(done => {
        sendEvent<AppStopMsg>('app.stop');
        eventListenerOnce<AppStoppedMsg>('app.stopped').subscribe(() => done())
    });

    it('should be able to send messages between p2ps', (done) => {
        let p2ps: P2p[] = [];

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            take(2),
            toArray(),
        ).subscribe(n => p2ps = n);


        sendEvent<P2pCreateMsg>('p2p.create', {p2pPort: 10010, rpcPort: 10050, bootstrapers: [], moniker: 'node1'});

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            first(),
            tap(p2p => sendEvent<P2pCreateMsg>('p2p.create', {moniker: 'node2', p2pPort: 10011, rpcPort: 10051, bootstrapers: [p2p.libp2p.getMultiaddrs()[0].toString()]}))
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
                    first(),
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

    it('should provide pub/sub', (done) => {
        let p2ps: P2p[] = [];

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            take(2),
            toArray(),
        ).subscribe(n => p2ps = n);


        sendEvent<P2pCreateMsg>('p2p.create', {p2pPort: 10010, rpcPort: 10050, bootstrapers: [], moniker: 'node1'});

        eventListenerOnce<P2pStartedMsg>('p2p.started').pipe(
            tap(p2p => sendEvent<P2pCreateMsg>('p2p.create', {moniker: 'node2', p2pPort: 10011, rpcPort: 10051, bootstrapers: [p2p.libp2p.getMultiaddrs()[0].toString()]}))
        ).subscribe()

        eventListener<P2pCreatedMsg>('p2p.created').pipe(
            take(2),
            tap(p2p => sendEvent<P2pStartMsg>('p2p.start', p2p)),
        ).subscribe()

        eventListener<P2pStartedMsg>('p2p.started').pipe(
            take(2),
            toArray(),
            tap(p2ps => sendEvent<P2pSubscribeMsg>('p2p.subscribe', {
                p2p: p2ps[0],
                topic: 'a-topic'
            })),
            delay(1000),
            tap(p2ps => sendEvent<P2pPublishMsg>('p2p.publish', {
                p2p: p2ps[1],
                topic: 'a-topic',
                msg: new TextEncoder().encode('HELLO!!')
            })),
            switchMap(() => eventListenerOnce<P2pMessageMsg>('p2p.message')),
            tap(msg => expect(msg.topic).to.equal('a-topic')),
            tap(msg => expect(msg.msg).to.deep.equal(new TextEncoder().encode('HELLO!!'))),
            tap(() => done())
        ).subscribe()
    });


    it('should allow peer discovery', (done) => {
        // create root p2p
        sendEvent<P2pCreateMsg>('p2p.create', {
            moniker: 'node1',
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
                    moniker: `node${offset + 1}`,
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
            tap((peers) => expect(peers.length).to.be.greaterThan(10)),
        ).subscribe()

        eventListener<P2pStoppedMsg>('p2p.stopped').pipe(
            take(5),
            toArray(),
            tap(() => done())
        ).subscribe()
    });

})