import {filter, first, map, Observable, Subject} from "rxjs";


export type Msg<TYPE, DATA = undefined> = {
    type: TYPE
    data: DATA
}

const centralBus = new Subject<Msg<unknown, unknown>>();
const centralBus$ = centralBus.asObservable();

export const eventListener = <T extends Msg<T['type'], T['data']>>(type: T['type']) => (centralBus$ as Observable<T>).pipe(
    filter(msg => msg.type === type),
    map(msg => msg.data as T['data'])
);

export const eventListenerOnce = <T extends Msg<T['type'], T['data']>>(type: T['type']) => (centralBus$ as Observable<T>).pipe(
    filter(msg => msg.type === type),
    first(),
    map(msg => msg.data as T['data'])
);

export const eventListenerMatchOnce = <T extends Msg<T['type'], T['data']>>(type: T['type'], predicate: (data: T['data']) => boolean) => (centralBus$ as Observable<T>).pipe(
    filter(msg => msg.type === type),
    filter(msg => predicate(msg.data)),
    first(),
    map(msg => msg.data as T['data'])
);


export const sendEventSync = <T extends Msg<T['type'], T['data']>>(type: T['type'], data?: T['data'] ) =>
    centralBus.next({type, data});

export const sendEventPartialSync = <T extends Msg<T['type'], T['data']>>(type: T['type']) => (data: T['data']) =>
    centralBus.next({type, data});

export const sendEvent =  <T extends Msg<T['type'], T['data']>>(type: T['type'], data?: T['data']) =>
    setTimeout(() => centralBus.next({type, data}));

export const sendEventPartial = <T extends Msg<T['type'], T['data']>>(type: T['type']) => (data: T['data']) =>
    setTimeout(() => centralBus.next({type, data}));

export const sendEventAndListenOnce = <SE extends Msg<SE['type'], SE['data']>, LE extends Msg<LE['type'], LE['data']>>(seType: SE['type'], leType: LE['type'], data?: SE['data']) => {
    sendEvent(seType, data);
    return eventListenerOnce(leType);
}

export const sendEventAsync = sendEvent;
export const sendEventPartialAsync = sendEventPartial

export const getCentralMsgBus = () => centralBus$;
