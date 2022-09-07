import {eventListener, eventListenerOnce, sendEvent, sendEventAndListenOnce} from "@scottburch/rxjs-msg-bus";
import {
    AccountExistsMsg, AccountUpdatedMsg,
    EnsureAccountExistsAction, IncAcctSeq,
} from "./accounts";
import {concatMap, delay, filter, pipe, switchMap, take, tap, timer, toArray, range, map} from 'rxjs'
import {AppStartMsg, AppStopMsg} from 'projects/libertynet/core/old/app'
import {expect} from "chai";
import {AppReadyMsg, AppStoppedMsg} from "../../app/src/app"
import * as fs from 'fs-extra'
import * as path from 'path'
import {describe} from 'mocha'


describe('accounts', function () {
    this.timeout(60_000);

    const doBefore = () => pipe(
        switchMap(() => fs.rm(path.join(__dirname, '../db-files'), {recursive: true, force: true})),
        tap(() => sendEvent<AppStartMsg>('app-start', {dbPath: path.join(__dirname, '../db-files')})),
        concatMap(() => eventListenerOnce<AppReadyMsg>('app-ready'))
    );

    const doAfter = () => pipe(
        tap(() => sendEvent<AppStopMsg>('app-stop')),
        concatMap(() => eventListenerOnce<AppStoppedMsg>('app-stopped')),
    );

    it('should increment account sequence', (done) => {
        eventListener<AccountUpdatedMsg>('account-updated').pipe(
            filter(({address}) => address === 'my-address2'),
            take(5),
            map(account => account.nextSeq),
            toArray(),
            tap(seqs => expect(seqs).to.deep.equal([1,2,3,4,5])),
            doAfter(),
            tap(() => done())
        ).subscribe();

        timer(1).pipe(
            doBefore(),
            switchMap(() => range(0, 5).pipe(
                tap(() => sendEvent<IncAcctSeq>('increment-account-seq', {address: 'my-address2', pubKey: 'my-pubkey2'}))
            ))
        ).subscribe()
    });

    it('should check if an account exists and create it if it does not', (done) => {
        eventListener<AccountExistsMsg>('account-exists').pipe(
            filter(({address}) => address === 'my-address'),
            take(2),
            toArray(),
            tap(accounts => {
                expect(accounts[0].address).to.equal('my-address')
                expect(accounts[0].pubKey).to.equal('my-pubkey');
                expect(accounts[0].address).to.equal('my-address')
                expect(accounts[1].pubKey).to.equal('my-pubkey');
            }),
            doAfter(),
            tap(() => done())
        ).subscribe()


        timer(1).pipe(
            doBefore(),
            tap(() => sendEvent<EnsureAccountExistsAction>('ensure-account-exists', {
                address: 'my-address',
                pubKey: 'my-pubkey'
            })),
            delay(1000),
            tap(() => sendEvent<EnsureAccountExistsAction>('ensure-account-exists', {
                address: 'my-address',
                pubKey: 'fake-pubkey'
            }))
        ).subscribe()
    });
});