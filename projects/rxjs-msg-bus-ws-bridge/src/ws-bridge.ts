import {WebSocketServer} from "ws";
import {fromEvent, map} from "rxjs";
import {getCentralMsgBus, sendEvent} from "@scottburch/rxjs-msg-bus";




export const newWsBridge = (port: number): void => {
    console.log('starting websocket bridge...');



    const wss = new WebSocketServer({port});
    fromEvent(wss, 'connection').pipe(
        map(x => (x as [WebSocket, Object])[0])
    )
        .subscribe(ws => {
            fromEvent(ws, 'message').pipe(
                map(x => JSON.parse((x as any).data))
            ).subscribe(msg => sendEvent(msg.type, msg.data));

            getCentralMsgBus().subscribe(msg => ws.send(JSON.stringify(msg)));
        });
}

