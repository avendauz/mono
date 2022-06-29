import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {WindowSizeEvent} from "./window";
import {filter, first, map, mergeMap, pipe, range, switchMap, takeUntil, tap} from "rxjs";
import jq from 'jquery';
import {whenMyTurn} from "./tick";
import {ALIEN_SIZE, ALIEN_SPEED, COLS, ROWS} from "./settings";
import {movement$} from "./alien-mover";
import {calculateLeft, calculateTop, getAlienSize, rerenderAlien} from "./alien-render";
import {MissileHitEvent, MissileUpdatedEvent} from "./missile";
import {StartGameEvent} from "./game";
import {dot} from "@scottburch/rxjs-utils";

export type Alien = {
    id: string
    x: number
    y: number
    el: JQuery
}

export type AlienCreatedEvent = Msg<'alien-created', Alien>
type AlienRenderedEvent = Msg<'alien-rendered', Alien>
export type AlienUpdatedEvent = Msg<'alien-updated', Alien>
export type AlienDestroyedEvent = Msg<'alien-destroyed', Alien>


const createAliens = (rows: number, cols: number) => pipe(
    switchMap(() => range(0, rows)),
    switchMap(row => range(0, cols).pipe(
        map(col => [row, col])
    )),
    map(([row, col]) => newAlien(row, col)),
    tap(sendEventPartial<AlienCreatedEvent>('alien-created'))
);

const newAlien = (row: number, col: number): Alien => ({
    id: `alien-${row}-${col}`,
    x: col * ALIEN_SIZE,
    y: row * ALIEN_SIZE,
    el: jq(),
});

eventListener<StartGameEvent>('start-game').pipe(
    first(),
    createAliens(ROWS, COLS),
).subscribe();

const takeUntilAlienDistroyed = (alien: Alien) => pipe(
    takeUntil(eventListener<AlienDestroyedEvent>('alien-destroyed').pipe(
        filter(a => a === alien)
    ))
);

eventListener<AlienRenderedEvent>('alien-rendered').pipe(
    mergeMap(alien =>
        eventListener<WindowSizeEvent>('windowResize').pipe(
            takeUntilAlienDistroyed(alien),
            map(() => alien)
        ),
    ),
    rerenderAlien
).subscribe();

eventListener<AlienRenderedEvent>('alien-rendered').pipe(
    mergeMap(alien =>
        whenMyTurn(ALIEN_SPEED, movement$).pipe(
            takeUntil(eventListener<AlienDestroyedEvent>('alien-destroyed').pipe(filter(a => a === alien))),
            map(move => ({move, alien})))
    ),
    tap(({move, alien}) => move(alien)),
    dot('alien'),
    rerenderAlien,
    tap(sendEventPartial<AlienUpdatedEvent>('alien-updated'))
).subscribe();

const checkCollision = pipe(
    tap(({alien, missile}) =>
        missile.top <= calculateTop(alien) + getAlienSize() &&
        missile.top >= calculateTop(alien) &&
        missile.left >= calculateLeft(alien) &&
        missile.left <= calculateLeft(alien) + getAlienSize() &&
        sendEvent<MissileHitEvent>('missile-hit', {missile, alien})
    ));


eventListener<AlienRenderedEvent>('alien-rendered').pipe(
    mergeMap(alien => eventListener<MissileUpdatedEvent>('missile-updated').pipe(
        takeUntilAlienDistroyed(alien),
        map(missile => ({alien, missile}))
    )),
    checkCollision
).subscribe()


eventListener<MissileHitEvent>('missile-hit').pipe(
    dot('alien'),
    tap(alien => alien.el.remove()),
    tap(sendEventPartial<AlienDestroyedEvent>('alien-destroyed'))
).subscribe();






