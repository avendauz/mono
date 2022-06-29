import {newUdpBridge, startUdpBridge, stopUdpBridge} from "./udp-bridge";
import {eventListener, getCentralMsgBus, sendEvent} from "@scottburch/rxjs-msg-bus";
import dgram from "dgram";
import {fromEvent, map, switchMap, tap} from "rxjs";
import {expect} from 'chai'
import {describe} from 'mocha'

describe('udp-bridge', function() {
    this.timeout(10_000);
    it('should send an event to udp when an event is received', (done) => {
        const bridge = newUdpBridge(5010, getCentralMsgBus(), 'test-source');

        const socket = dgram.createSocket({type: 'udp4', reuseAddr: true}).bind(5010);
        fromEvent(socket, 'message').pipe(
            map(data => (data as Uint8Array[])[0].toString()),
            map(data => JSON.parse(data)),
            tap(data => expect(data.source).to.equal('test-source')),
            tap(({event}) => expect(event.type).to.equal('my-event')),
            tap(({event}) => expect(event.data).to.deep.equal({foo: 10})),
            switchMap(() => stopUdpBridge(bridge))
        ).subscribe(() => socket.close(() => setTimeout(done, 5000)))

        startUdpBridge(bridge)


        sendEvent('my-event', {foo: 10});
    });

    it('should receive an event', (done) => {
        const bridge = newUdpBridge(5010, getCentralMsgBus(), 'test-source');
        startUdpBridge(bridge);

        eventListener('my-event').pipe(
            tap(data => expect(data).to.deep.equal({foo: 20}))
        ).subscribe(() => done());

        const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
            socket.send(JSON.stringify({
            "event": {
                "type": "my-event",
                "data": {
                    "foo": 20
                }
            },
            "source": "another-source"
        }), 5010, '224.0.0.1');
    })
});