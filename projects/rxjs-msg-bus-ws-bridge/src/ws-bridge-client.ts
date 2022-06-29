import {Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {Subject, tap} from "rxjs";
import {webSocket} from 'rxjs/webSocket'

let ws = new Subject<Msg<unknown, unknown>>()

export const newWsClientBridge = (url: string) => {
    ws = webSocket<Msg<unknown, unknown>>(`ws://${url}`);

    ws.pipe(
        tap(event => sendEvent(event.type, event.data))
    ).subscribe();
}

export const sendToServer = <T extends Msg<T['type'], T['data']>>(data: Msg<T['type'], T['data']>): void =>
    ws.next(data);

