import {startSwarm, stopHornet, stopSwarm, Swarm} from "@libertynet/test/src/swarm-utils";
import {AppStartMsg, AppStopMsg} from "@libertynet/app";
import {toArray, concatMap, delay, filter, from, map, range, switchMap, take, tap, timer, first} from 'rxjs'
import {eventListener, eventListenerOnce, sendEvent} from "@scottburch/rxjs-msg-bus";
import './iotaConnector'
import {
    ClientConnectedMsg,
    MilestoneDetectionErrorMsg,
    NewLibertynetMessageMsg,
    NewMilestoneDetectedMsg,
    SendLibertynetMessageAction
} from "./messages";
import '@libertynet/test/src/test-app'
import {rm} from "fs/promises";
import {expect} from 'chai'
import {AppReadyMsg, AppStoppedMsg} from "@libertynet/app/src/app";
import {describe} from 'mocha'

describe('iota-connector', function() {
    this.timeout(80_000);

    beforeEach(() =>
        rm(__dirname + '/../db-files', {recursive: true, force: true})
    );

    it('should pick up the nodeUrl from the app-start to connect to', (done) => {
        sendEvent<AppStartMsg>('app-start', {
            dbPath: __dirname + '/../db-files',
            nodeUrl: 'http://localhost:2222'
        });

        eventListenerOnce<ClientConnectedMsg>('client-connected').pipe(
            tap(client => expect((client as any)._endpoint).to.equal('http://localhost:2222')),
            delay(1000),
            tap(() => sendEvent<AppStopMsg>('app-stop')),
            switchMap(() => eventListenerOnce<AppStoppedMsg>('app-stopped')),
            tap(() => done())
        ).subscribe();

    });

    it('should send a milestone detection error if a swarm is not up yet', (done) => {
        timer(0).pipe(
            switchMap(() => stopHornet().toPromise()),
            tap(() => sendEvent<AppStartMsg>('app-start', {dbPath: __dirname + '/../db-files'})),
            switchMap(() => eventListenerOnce<AppReadyMsg>('app-ready')),
            switchMap(() => eventListenerOnce<MilestoneDetectionErrorMsg>('milestone-detection-error')),
            tap(() => sendEvent<AppStopMsg>('app-stop')),
            switchMap(() => eventListenerOnce<AppStoppedMsg>('app-stopped')),
        ).subscribe(() => done());
    });

    it('should detect a new milestone when they occur', (done) => {
        timer(0).pipe(
            switchMap(() => startSwarm().toPromise()),
            tap(() => sendEvent<AppStartMsg>('app-start', {dbPath: __dirname + '/../db-files'})),
            concatMap(swarm => eventListener<NewMilestoneDetectedMsg>('new-milestone-detected')
                .pipe(
                    map(ms => ({ms, swarm}))
                )
            ),
            filter(({ms}) => ms.index === 3),
            first(),
            tap(() => sendEvent<AppStopMsg>('app-stop')),
            switchMap(({swarm}) => eventListenerOnce<AppStoppedMsg>('app-stopped').pipe(
                map(() => ({swarm}))
            )),
            switchMap(({swarm}) => stopSwarm(swarm)),
            tap(() => done())
        ).subscribe();
    });

    it('should be able to send a libertynet message', (done) => {
        let swarm: Swarm;
        eventListener<NewLibertynetMessageMsg>('new-libertynet-message').pipe(
            take(20),
            toArray(),
            tap(() => sendEvent<AppStopMsg>('app-stop')),
            switchMap(() => eventListenerOnce<AppStoppedMsg>('app-stopped')),
            switchMap(() => stopSwarm(swarm)),
            tap(() => done())
        ).subscribe();

        from(startSwarm().toPromise()).pipe(
            tap(swrm => swarm = swrm),
            tap(() => sendEvent<AppStartMsg>('app-start', {dbPath: __dirname + '/../db-files'})),
            switchMap(() => eventListenerOnce<AppReadyMsg>('app-ready')),
            switchMap(() => range(0, 20)),
            tap(n =>
                sendEvent<SendLibertynetMessageAction>('send-libertynet-message',
                    Buffer.from([n]).toString('hex')
                )
            )
        ).subscribe()
    });
});