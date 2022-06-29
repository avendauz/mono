import {
    eventListener,
    eventListenerOnce,
    Msg,
    sendEvent,
    sendEventAndListenOnce,
    sendEventPartial,
    sendEventSync
} from "./rxjs-msg-bus";
import {scan, tap, map} from "rxjs";
import {expect} from  'chai';

describe('types', () => {
    type Single = Msg<'single'>
    type Double = Msg<'double', {foo: number}>

    eventListener<Single>('single').pipe(
        map(data => data)
    );

    eventListener<Double>('double').pipe(
        map(data => data.foo)
    );

    sendEvent<Single>('single');
    sendEvent<Double>('double', {foo:10});
});

describe('rxjs-msg-bus', () => {
    type TestEvent = Msg<string, number>

    describe('aync events', () => {
        it('should notify on an event', (done) => {
            eventListener<TestEvent>('test-event1').pipe(
                scan((total, n) => total + n, 0)
            ).subscribe(total => total === 21 && done());

            sendEvent<TestEvent>('test-event1', 10);
            sendEventPartial<TestEvent>('test-event1')(11)
        });

        it('should allow for a hot observable', (done) => {
            eventListener<TestEvent>('test-event2').pipe(
                tap(() => done())
            ).subscribe();
            sendEvent<TestEvent>('test-event2', 100)
        });
    });

    describe('sync events', () => {
        it('should notify on an event sync', (done) => {
            eventListenerOnce<TestEvent>('test-event3').pipe(
                tap(() => done())
            ).subscribe();
            sendEventSync<TestEvent>('test-event3', 1)
        });

        it('should be able to send an event and listen for a single event', (done) => {
            type SendEvent = Msg<'send-event', {foo: number}>;
            type ListenEvent = Msg<'listen-event', {foo: number}>;
            sendEventAndListenOnce<SendEvent, ListenEvent>('send-event', 'listen-event', {foo: 10}).pipe(
                tap(x => expect(x).to.deep.equal({foo: 20})),
                tap(() => done())
            ).subscribe();

            eventListenerOnce<SendEvent>('send-event').pipe(
                tap(x => expect(x).to.deep.equal({foo: 10})),
                tap(() => sendEvent<ListenEvent>('listen-event', {foo: 20}))
            ).subscribe()
        });
    });


});