import * as fs from 'fs-extra'
import {AppStartMsg, AppStopMsg} from 'projects/libertynet/core/old/app'
import {concatMap, delay, map, pipe, switchMap, tap, timer} from 'rxjs'
import {eventListenerOnce, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {buildKey, bytesToNum, DbWriteAction, numToBytes, readFromDb, stringToBytes} from "./db";
import {expect} from "chai";
import {AppReadyMsg, AppStoppedMsg} from "../../app/src/app";
import {describe} from 'mocha'


describe('db', function() {
    this.timeout(6_000);

    const doBefore = pipe(
        switchMap(() => fs.rm(__dirname + '/../db-files', {recursive: true, force: true})),
        tap(() => sendEvent<AppStartMsg>('app-start', {dbPath: __dirname + '/../db-files'})),
        concatMap(() => eventListenerOnce<AppReadyMsg>('app-ready'))
    );

    const doAfter = pipe(
        tap(() => sendEvent<AppStopMsg>('app-stop')),
        concatMap(() => eventListenerOnce<AppStoppedMsg>('app-stopped')),
    );


    it('should be able to convert number to bytes and bytes to number', () => {
        expect(Array.from(numToBytes(257))).to.deep.equal([1, 1]);
        expect(bytesToNum(numToBytes(2581))).to.equal(2581);
    })

    it('should have a read convinience method', (done) => {
        timer(0).pipe(
            doBefore,
            map(() => ({
                key: buildKey('my-appId', 'my-category', 'my-key'),
                value: new Uint8Array([1,2,3])
            })),
            tap(sendEventPartial<DbWriteAction>('write-to-db')),
            map(({key}) => ({key})),
            readFromDb(),
            tap(val => expect(Array.from(val)).to.deep.equal([1,2,3])),
            doAfter,
            tap(() => done())
        ).subscribe()
    });

    it("should work across instances of the app", (done) => {
        timer(0).pipe(
            doBefore,
            delay(1000),
            tap(() => sendEvent<DbWriteAction>('write-to-db', {
                key: stringToBytes('my-key'),
                value: stringToBytes('testing')
            })),
            doAfter,
            tap(() => done())
        ).subscribe()
    })
});