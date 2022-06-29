import {eventListener, Msg, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {WindowSizeEvent} from "./window";
import {first} from "rxjs";

export type StartGameEvent = Msg<'start-game', {}>

eventListener<WindowSizeEvent>('windowResize').pipe(
    first(),
).subscribe(sendEventPartial<StartGameEvent>('start-game'));
