import {TestSwarmStartedMsg, TestSwarmStartMsg, TestSwarmStopMsg, TestSwarmStoppedMsg} from "./testSwarm";
import {
    eventListener,
    eventListenerOnce,
    getCentralMsgBus,
    sendEvent,
    sendEventPartial
} from "@scottburch/rxjs-msg-bus";
import {map, range, switchMap, take, tap, toArray} from "rxjs";
import {describe, it} from 'mocha'
import {expect} from 'chai'
import {AppStartMsg, AppStopMsg, AppStartedMsg, AppStoppedMsg} from "@libertynet/core";

getCentralMsgBus().subscribe(console.log)

describe('starting a swarm', function() {
    this.timeout(60_000)
    beforeEach(done => {
        sendEvent<AppStartMsg>('app.start');
        eventListenerOnce<AppStartedMsg>('app.started').subscribe(() => done())
    });

    afterEach(done => {
        sendEvent<AppStopMsg>('app.stop');
        eventListenerOnce<AppStoppedMsg>('app.stopped').subscribe(() => done())
    });

    it('can start a 3 node swarm', (done) => {
        range(1, 3).pipe(
            map(n => ({
                moniker: `node-${n}`,
                p2pConfig: {
                    p2pPort: 10010 + n,
                    rpcPort: 10050 + n,
                    bootstrapers: []
                }
            })),
            take(3),
            toArray(),
            tap(configs => sendEvent<TestSwarmStartMsg>('test.swarm-start', {nodeConfigs: configs})),
            switchMap(() => eventListenerOnce<TestSwarmStartedMsg>('test.swarm-started')),
            tap(swarm => expect(swarm.nodes).to.have.length(3)),
            tap(sendEventPartial<TestSwarmStopMsg>('test.swarm-stop')),
            switchMap(() => eventListener<TestSwarmStoppedMsg>('test.swarm-stopped'))
        ).subscribe(() => done())
    })
})