import {eventListener, sendEvent, sendEvent} from "@scottburch/rxjs-msg-bus";
import {RegisterNewRouteHandler} from "@libertynet/router";
import {AppStartMsg} from "@libertynet/app";
import {map, tap} from "rxjs";
import {SendSignedObjMessageAction} from "@libertynet/crypto/src/crypto";
import {TextMessage} from '@libertynet/text-message-plugin'
import {RouteHandlerMsg} from "@libertynet/router/src/router";

const instanceNum = parseInt(process.argv[3] || '1');

sendEvent<RegisterNewRouteHandler>('register-new-route', {
    typeUrl: 'text-message',
    event: 'text-message-received'
});

const start = Date.now();
eventListener<RouteHandlerMsg>('text-message-received').pipe(
    map(obj => TextMessage.decode(obj.data)),
    tap(x => console.log('*******', Date.now() - start, x.text))
).subscribe()

sendEvent<AppStartMsg>('app-start', {
    dbPath: `${__dirname}/../db-files${instanceNum}`,
    nodeUrl: `http://localhost:${14265 + instanceNum - 1}`
});


(function loop(n: number){
        sendEvent<SendSignedObjMessageAction>('send-signed-obj-message', {
            data: TextMessage.encode({
                owner: '',
                text: 'text message '+ n
            }).finish(),
            typeUrl: 'text-message',
            password: 'my-password',
            username: 'my-username'
        });
        setTimeout(() => loop(n + 1), 2000)
}(1))


