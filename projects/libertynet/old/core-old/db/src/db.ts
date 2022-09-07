import {eventListener, eventListenerOnce, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {AppStartMsg, AppStopMsg} from 'projects/libertynet/core/old/app'
import {Level} from "level";
import {
    catchError,
    concatMap,
    filter,
    first,
    from,
    map,
    of,
    pipe,
    switchMap,
    takeUntil,
    tap, timer,
    withLatestFrom
} from 'rxjs'

type Key = Uint8Array
type Value = Uint8Array

export type DbConnectionMsg = Msg<'db-connection', Level>
export type DbWriteAction = Msg<'write-to-db', { key: Key, value: Value }>
export type DbReadAction = Msg<'read-from-db', { key: Key }>
export type ValueReadFromDbMsg = Msg<'value-read-from-db', { key: Key, value: Value }>

export const buildKey = (appId: string, category: string, key: string) =>
    new TextEncoder().encode(`${appId}:${category}:${key}`);


export const numToBytes = (num: number) => {
    let hex = num.toString(16)
    hex = hex.length % 2 ? `0${hex}` : hex;
    return Buffer.from(hex, 'hex');
}

export const bytesToNum = (bytes: Uint8Array) =>
    parseInt(Buffer.from(bytes).toString('hex') || '0', 16);

export const bytesToString = (bytes: Uint8Array) =>
    new TextDecoder().decode(bytes);

export const stringToBytes = (s: string) =>
    new TextEncoder().encode(s);


export const readFromDb = () => pipe(
    tap(({key}) => sendEvent<DbReadAction>('read-from-db', {key})),
    concatMap(({key}) =>
        eventListener<ValueReadFromDbMsg>('value-read-from-db').pipe(
            filter(read => read.key.toString() === key.toString()),
            first(),
            map(({value}) => value)
        )
    )
);

eventListener<AppStartMsg>('app-start').pipe(
    map(appConfig => new Level(appConfig.dbPath || `${__dirname}/../../db-files`, {
        valueEncoding: 'view',
        keyEncoding: 'view',
        cacheSize: 0,
        compression: false
    })),
    tap(x => x),
    tap(sendEventPartial<DbConnectionMsg>('db-connection'))
).subscribe();

eventListener<AppStopMsg>('app-stop').pipe(
    withLatestFrom(eventListener<DbConnectionMsg>('db-connection')),
    concatMap(([_, conn]) => conn.close()),
    tap(() => sendEvent<DbConnectionMsg>('db-connection', undefined))
).subscribe();


eventListener<DbConnectionMsg>('db-connection').pipe(
    switchMap((db) => eventListener<DbWriteAction>('write-to-db').pipe(
        takeUntil(eventListener<AppStopMsg>('app-stop')),
        concatMap((data) => db.put(data.key, data.value, {keyEncoding: 'view', valueEncoding: 'view'})),
    ))
).subscribe();

eventListener<DbConnectionMsg>('db-connection').pipe(
    switchMap(db => eventListener<DbReadAction>('read-from-db').pipe(
        takeUntil(eventListenerOnce<AppStopMsg>('app-stop')),
        concatMap(data => from(db.get<Uint8Array, Uint8Array>(data.key, {keyEncoding: 'view', valueEncoding: 'view'})).pipe(
            catchError(() => of(new Uint8Array())),
            map(value => ({key: data.key, value}))
        ))
    )),
    tap(({key, value}) => sendEvent<ValueReadFromDbMsg>('value-read-from-db', {key, value}))
).subscribe();

