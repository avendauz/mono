import {
    eventListenerMatchOnce,
    eventListenerOnce, getCentralMsgBus,
    sendEvent,
    sendEventPartial
} from "@scottburch/rxjs-msg-bus";
import {concatMap, tap} from "rxjs";
import {describe, it} from 'mocha'
import {NodeStartedMsg, NodeStartMsg, NodeStopMsg, NodeStoppedMsg} from "./node";
import {AppStartMsg, AppStopMsg} from "../../app/src/app";
import {AppStartedMsg, AppStoppedMsg} from "../../app/src/app";

getCentralMsgBus().subscribe(console.log)

describe('node', function() {
    this.timeout(30_000);

    beforeEach(done => {
        sendEvent<AppStartMsg>('app.start');
        eventListenerOnce<AppStartedMsg>('app.started').subscribe(() => done())
    });

    afterEach(done => {
        sendEvent<AppStopMsg>('app.stop');
        eventListenerOnce<AppStoppedMsg>('app.stopped').subscribe(() => done())
    });

    it('should be able to start a node', (done) => {
        sendEvent<NodeStartMsg>('node.start', {
            moniker: 'my-node', p2pConfig: {
                p2pPort: 10010,
                rpcPort: 10050,
                bootstrapers: []
            }
        });
        eventListenerOnce<NodeStartedMsg>('node.started').pipe(
            tap(sendEventPartial<NodeStopMsg>('node.stop')),
            concatMap(node => eventListenerMatchOnce<NodeStoppedMsg>('node.stopped', stopped => node.moniker === stopped.moniker)),
            tap(() => done())
        ).subscribe()
    })
});

