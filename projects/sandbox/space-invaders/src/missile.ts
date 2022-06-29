import {eventListener, Msg, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {filterKey, KeyEvent} from "./keyboard";
import {filter, map, mergeMap, of, pipe, Subscription, tap, throttle} from "rxjs";
import {TickEvent, whenMyTurn} from "./tick";
import {FIRE_RATE, MISSLE_HEIGHT, MISSLE_WIDTH} from "./settings";
import {getBarrelLocation, GunUpdatedEvent} from "./gun";
import jq from "jquery";
import {getContainer} from "./alien-render";
import {RunningEvent} from "./running";
import {uniqueId} from "lodash";
import {Alien} from "./alien";
import {switchToLatestFrom} from "@scottburch/rxjs-utils";

export type Missile = {
    id: string,
    top: number
    left: number
    el: JQuery
    tick?: Subscription
}



export type MissileUpdatedEvent = Msg<'missile-updated', Missile>;
export type MissileHitEvent = Msg<'missile-hit', {missile: Missile, alien: Alien}>;


const updateMissile = pipe(
    tap((missile: Missile) =>
        missile.el
            .css('top', missile.top)
            .css('left', missile.left)
    )
);

const destroyMissile = pipe(
    tap((missile: Missile) => missile.el.remove()),
    tap(missile => missile.tick?.unsubscribe())
);


const addTickListener = (missile: Missile) =>
    missile.tick = eventListener<TickEvent>('tick').pipe(
        mergeMap(() => of(missile)),
        tap(missile => missile.top -= 1),
        updateMissile,
        tap(sendEventPartial<MissileUpdatedEvent>('missile-updated'))
    ).subscribe();

eventListener<MissileUpdatedEvent>('missile-updated').pipe(
    filter(missile => missile.top < 0),
    destroyMissile
).subscribe()

eventListener<MissileHitEvent>('missile-hit').pipe(
    map(data => data.missile),
    destroyMissile
).subscribe();



const createMissile = pipe(
    map((start: { x: number, y: number }) => ({
        id: `missile-${uniqueId()}`,
        left: start.x - (MISSLE_WIDTH / 2),
        top: start.y - MISSLE_HEIGHT,
        isAlive: true,
        el: jq('<div></div>')
            .css('position', 'absolute')
            .css('background', 'blue')
            .css('height', MISSLE_HEIGHT)
            .css('width', MISSLE_WIDTH)
            .appendTo(getContainer())
    })),
    tap(addTickListener)
);


const fireMissile = pipe(
    getBarrelLocation,
    createMissile,
    updateMissile
);


const spaceBar$ = eventListener<KeyEvent>('key-event').pipe(filterKey(' '));

spaceBar$.pipe(
    filter(spaceBar => spaceBar.state === 'down'),
    switchToLatestFrom(eventListener<RunningEvent>('is-running')),
    filter(isRunning => isRunning),
    throttle(() => whenMyTurn(FIRE_RATE, of(''))),
    switchToLatestFrom(eventListener<GunUpdatedEvent>('gun-updated')),
    fireMissile
).subscribe()