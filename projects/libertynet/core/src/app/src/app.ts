import {eventListener, Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {delay, tap} from "rxjs";

export type AppStartMsg = Msg<'app.start'>;
export type AppStartedMsg = Msg<'app.started'>;
export type AppStopMsg = Msg<'app.stop'>;
export type AppStoppedMsg = Msg<'app.stopped'>;

eventListener<AppStartMsg>('app.start').pipe(
    delay(2000),
    tap(() => sendEvent<AppStartedMsg>('app.started'))
).subscribe();

eventListener<AppStopMsg>('app.stop').pipe(
    delay(2000),
    tap(() => sendEvent<AppStoppedMsg>('app.stopped'))
).subscribe()
