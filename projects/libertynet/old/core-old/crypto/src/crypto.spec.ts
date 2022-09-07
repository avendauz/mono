import {
    createPrivateKey,
    decodeSignedObj,
    encodeSignedObj,
    getPublicKey,
    NewValidSignedObjMsg,
    SendSignedObjMessageAction,
    signData,
    verifySig,
    verifySignedObj
} from "./crypto";
import {toArray, filter, from, map, of, scan, switchMap, take, tap, timer, withLatestFrom} from "rxjs";
import {expect} from "chai";
import {eventListener, eventListenerOnce, sendEvent} from "@scottburch/rxjs-msg-bus";
import {startSwarm, stopSwarm, Swarm} from '@libertynet/test/src/swarm-utils'
import {AppStartMsg, AppStopMsg} from 'projects/libertynet/core/old/app'
import 'projects/libertynet/core/old/iota-connector'
import 'projects/libertynet/core/old/accounts'
import './crypto'
import {rm} from "fs/promises";
import {range} from "lodash";
import {AppReadyMsg, AppStoppedMsg} from "../../app/src/app";


describe('crypto', () => {
    beforeEach(() => rm(__dirname + '/../db-files', {force: true, recursive: true}));
    beforeEach((done) => timer(0).pipe(
        tap(() => sendEvent<AppStartMsg>('app-start', {dbPath: __dirname + '/../db-files'})),
        switchMap(() => eventListenerOnce<AppReadyMsg>('app-ready'))
    ).subscribe(() => done()));

    afterEach((done) => timer(0).pipe(
        tap(() => sendEvent<AppStopMsg>('app-stop')),
        switchMap(() => eventListenerOnce<AppStoppedMsg>('app-stopped'))
    ).subscribe(() => done()))

    it('should create a signed object from a username and password', (done) => {

        of({
            username: 'my-name',
            password: 'my-password',
            data: new TextEncoder().encode('my-data'),
            typeUrl: 'test-data'
        }).pipe(
            encodeSignedObj(),
            decodeSignedObj(),
            tap(signedObj => {
                expect(signedObj.version).to.equal(1);
                expect(signedObj.payload[0].data?.typeUrl).to.equal('test-data');
                expect(signedObj.owner).to.contain('liberty');
                expect(signedObj.payload[0].data?.value.toString()).to.equal('my-data');
            }),
            tap(() => done())
        ).subscribe()
    });

    it('should verify a signed object true with a good public key', (done) => {
        of({
            username: 'my-name',
            password: 'my-password',
            data: new TextEncoder().encode('my-data'),
            typeUrl: 'test-data'
        }).pipe(
            encodeSignedObj(),
            decodeSignedObj(),
            map(signedObj => ({signedObj, pubKey: signedObj.pubKey})),
            verifySignedObj(),
            tap(result => expect(result.isValid).to.be.true)

        ).subscribe(() => done());
    });

    it('should fail to verify a signed object with  bad data', (done) => {
        of({
            username: 'my-name',
            password: 'my-password',
            data: new TextEncoder().encode('my-data'),
            typeUrl: 'test-data'
        }).pipe(
            encodeSignedObj(),
            decodeSignedObj(),
            map(signedObj => ({...signedObj, payload: [{...signedObj.payload[0], data: {typeUrl: '', value: new TextEncoder().encode('ay-data')}}]})),
            map(signedObj => ({signedObj, pubKey: signedObj.pubKey})),
            verifySignedObj(),
            tap(result => expect(result.isValid).to.be.false)

        ).subscribe(() => done());
    });


    it('should fail to verify a signed object with a bad public key', (done) => {
        of({
            username: 'my-name',
            password: 'my-password',
            data: new TextEncoder().encode('my-data'),
            typeUrl: 'test-data'
        }).pipe(
            encodeSignedObj(),
            decodeSignedObj(),
            map(signedObj => ({...signedObj, pubKey: signedObj.pubKey.replace('9', 'a')})),
            map(signedObj => ({signedObj, pubKey: signedObj.pubKey})),
            verifySignedObj(),
            tap(result => expect(result.isValid).to.be.false)

        ).subscribe(() => done());
    });

    it('should create a private key from a name and password', (done) => {
        of({username: 'my-name', password: 'my-password'}).pipe(
            createPrivateKey(),
            tap(key => expect(key).to.equal('202020202020206d792d6e616d656d792d70617373776f726420202020202020'))
        ).subscribe(() => done())
    });

    it('should sign some data using a private key', (done) => {
        const privateKey = of({username: 'my-name', password: 'my-password'}).pipe(
            createPrivateKey()
        );

        of(new TextEncoder().encode('my-data')).pipe(
            withLatestFrom(privateKey),
            map(([data, privateKey]) => ({data, privateKey})),
            signData(),
            withLatestFrom(privateKey),
            switchMap(([sig, privateKey]) => of(privateKey).pipe(getPublicKey(), map(pubKey => [sig, pubKey]))),
            map(([sig, pubKey]) => ({data: new TextEncoder().encode('my-data'), sig, pubKey})),
            verifySig(),
            tap(result => expect(result).to.be.true),
            tap(() => done())
        ).subscribe();
    });

    // TODO: Need to put back when we can continue working on signed object sequencing
    it.skip('should be able to send data wrapped as a signed object', (done) => {
        let swarm: Swarm
        eventListener<NewValidSignedObjMsg>('new-valid-signed-obj').pipe(
            filter(signedObj => signedObj.payload[0].data?.typeUrl === 'my-type'),
            take(10),
            map(signedObj => signedObj.payload[0].data?.value[0] || 0),
            scan((last, n) => {
                expect(n).to.equal(last)
                return n + 1;
            }, 0),
            toArray(),
            switchMap(() => stopSwarm(swarm)),
            tap(() => done())
        ).subscribe();

        from(startSwarm().toPromise()).pipe(
            tap(swrm => swarm = swrm),
            switchMap(() => range(0, 10)),
            map(n => new Uint8Array([n])),
            tap(data => sendEvent<SendSignedObjMessageAction>('send-signed-obj-message', {
                data,
                typeUrl: 'my-type',
                password: 'my-password',
                username: 'my-username'
            })),
        ).subscribe()
    });
});




