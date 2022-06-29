import {map, scan} from "rxjs";
import {newUdpBridge} from "@scottburch/rxjs-msg-bus-udp-bridge/lib/udp-bridge";
import {getCentralMsgBus, Msg} from "@scottburch/rxjs-msg-bus";


newUdpBridge(5010, getCentralMsgBus(), 'logger');

getCentralMsgBus().pipe(
    scan(({lastTime, delta, msg}, newMsg) =>
        ({lastTime: Date.now(), delta: Date.now() - lastTime, msg: newMsg}), {
        lastTime: Date.now(),
        delta: 0,
        msg: {} as Msg<unknown, unknown>
    }),
    map(({lastTime, delta, msg}) => `${new Date(lastTime).toISOString()} ${delta}: ${JSON.stringify(msg)}`)
).subscribe(console.log);

