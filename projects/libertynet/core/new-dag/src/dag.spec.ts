import {describe, it} from 'mocha'
import {eventListener, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {
    DagMessageMetaWrapper,
    DagMessageReceived,
    DagRequestMessage,
    DagValidMessageReceived,
    newDagMessage,
    numToInt32
} from "./dag";
import {DagMessage} from "./dagMessage";
import {first, map, take, tap, toArray} from 'rxjs'
import {expect} from 'chai'
import './dagLogging'
/**
 dag message received from peer
 write message to buffer
 see if parents are in the DB
 if all parents in DB write message to DB
 if not request parents and repeat


 **/

describe('dag', function () {
    it('should request parents when a valid dag message is received from a peer', (done) => {
        newDagMessage(testMsg).pipe(
            map(msg => ({msg, source: 'peer'} as DagMessageMetaWrapper)),
            tap(sendEventPartial<DagValidMessageReceived>('dag.valid-message-received'))
        ).subscribe()

        eventListener<DagRequestMessage>('dag.request-message').pipe(
            take(2),
            toArray(),
            tap(reqs => expect(reqs).to.deep.equal([{
                source: 'local',
                id: new Uint8Array([1, 2, 3])
            }, {
                source: 'local',
                id: new Uint8Array([4, 5, 6])
            }])),
            tap(() => done())
        ).subscribe()
    });

    it('should validate newly received messages', (done) => {
        newDagMessage({
            parentIds: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
            type: 'test',
            payload: new Uint8Array([1, 2, 3, 4, 5, 6]),
            sig: {
                pubKey: new Uint8Array([10, 20, 30]),
                signature: new Uint8Array([1, 2, 3])
            },
            sequence: 1,
            version: 1,
            timestamp: new Date(0)
        }).pipe(
            tap(msg => sendEvent<DagMessageReceived>('dag.message-received', {msg, source: 'peer'}))
        ).subscribe()

        eventListener<DagValidMessageReceived>('dag.valid-message-received').pipe(
            first(),
            tap(() => done())
        ).subscribe()

    })

    describe('numToInt64', () => {
        it('should calculate correctly', () =>
            expect(numToInt32(10)).to.deep.equal(new Uint8Array([0, 0, 0, 10]))
        )
    })
});

const testMsg: Omit<DagMessage, 'id'> = {
    parentIds: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
    type: 'test',
    payload: new Uint8Array([1, 2, 3, 4, 5, 6]),
    sig: {
        pubKey: new Uint8Array([10, 20, 30]),
        signature: new Uint8Array([1, 2, 3])
    },
    sequence: 1,
    version: 1,
    timestamp: new Date(0)
}