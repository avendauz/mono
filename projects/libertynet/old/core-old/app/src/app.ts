import {eventListener, eventListenerOnce, getCentralMsgBus, Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {concatMap, delay, first, map, switchMap, takeUntil, tap} from 'rxjs'
import {bytesToString, DbConnectionMsg, DbWriteAction, ValueReadFromDbMsg} from "../../db/src/db";
import {tapAsync} from "@scottburch/rxjs-utils/lib/tapAsync";


export type AppConfig = {
    dbPath: string
    nodeUrl?: string
}

export type EnableLogCentralBusMsg = Msg<'enable-log-central-bus'>
export type DisableLogCentralBusMsg = Msg<'disable-log-central-bus'>

export type AppStartMsg = Msg<'app-start', AppConfig>;
export type AppStopMsg = Msg<'app-stop'>;
export type AppReadyMsg = Msg<'app-ready', AppConfig>;
export type AppStoppedMsg = Msg<'app-stopped'>;


eventListener<EnableLogCentralBusMsg>('enable-log-central-bus').pipe(
    first(),
    switchMap(() => getCentralMsgBus()),
    map(entry => entry.type === 'read-from-db' ? ({
        type: entry.type,
        key: bytesToString((entry as DbWriteAction).data.key)
    }) : entry),
    map(entry => entry.type === 'write-to-db' ? ({
        type: entry.type,
        key: bytesToString(((entry as DbWriteAction).data.key)),
        value: Array.from((entry as DbWriteAction).data.value).toString()
    }) : entry),
    map(entry => entry.type === 'value-read-from-db' ? ({
        type: entry.type,
        key: bytesToString(((entry as ValueReadFromDbMsg).data.key)),
        value: Array.from((entry as ValueReadFromDbMsg).data.value).toString()
    }) : entry),
    takeUntil(eventListenerOnce<DisableLogCentralBusMsg>('disable-log-central-bus')),
).subscribe(entry => console.log(new Date().toISOString(), entry));

eventListener<AppStartMsg>('app-start').pipe(
    concatMap((config: AppConfig) => eventListenerOnce<DbConnectionMsg>('db-connection').pipe(map(() => config))),
    tap((config) => sendEvent<AppReadyMsg>('app-ready', config)),
).subscribe()

eventListener<AppStopMsg>('app-stop').pipe(
    delay(1000),
    tapAsync(() => sendEvent<AppStoppedMsg>('app-stopped'))
).subscribe()

sendEvent<EnableLogCentralBusMsg>('enable-log-central-bus');




