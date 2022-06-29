import {eventListener, Msg, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {KeyEvent} from "./keyboard";
import {filter, scan, tap} from "rxjs";


export type RunningEvent = Msg<'is-running', boolean>


eventListener<KeyEvent>('key-event').pipe(
    filter(it => it.key === 's' && it.state === 'up'),
    scan((running) => !running, false),
    tap(sendEventPartial<RunningEvent>('is-running'))
).subscribe()