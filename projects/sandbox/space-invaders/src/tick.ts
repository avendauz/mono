import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {debounceTime, filter, interval, map, Observable, scan, withLatestFrom} from "rxjs";
import {RunningEvent} from "./running";
import {TICK_START} from "./settings";
import {GameOverEvent} from "./game-over";
import {AlienDownEvent} from "./alien-mover";
import {switchToLatestFrom} from "@scottburch/rxjs-utils";

export type TickEvent = Msg<'tick', number>
export type SpeedEvent = Msg<'speed', number>

setTimeout(() => sendEvent<SpeedEvent>('speed', TICK_START));

eventListener<AlienDownEvent>('alien-down').pipe(
    debounceTime(1000),
    switchToLatestFrom(eventListener<SpeedEvent>('speed'))
).subscribe(speed =>
    sendEvent<SpeedEvent>('speed', Math.max(1, speed - 1))
)

interval(1).pipe(
    withLatestFrom(eventListener<SpeedEvent>('speed')),
    filter(([count, speed]) => count % speed === 0),
    withLatestFrom(eventListener<RunningEvent>('is-running'), eventListener<GameOverEvent>('game-over')),
    filter(([, isRunning]) => isRunning),
    filter(([, , gameOver]) => !gameOver),
    scan((count) => count + 1, 0)
).subscribe(sendEventPartial<TickEvent>('tick'));


export const whenMyTurn = <T>(speed: number, observable: Observable<T>) =>
    eventListener<TickEvent>('tick').pipe(
        filter(count => count % speed === 0),
        withLatestFrom(observable),
        map(([, value]) => value as T)
    );