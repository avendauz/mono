import {eventListener, Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {WindowSizeEvent} from "./window";
import {filter, first, map, pipe, scan, tap} from "rxjs";
import {getContainer} from "./alien-render";
import {GUN_ASPECT, GUN_SIZE} from "./settings";
import jq from "jquery";
import {KeyEvent} from "./keyboard";
import {TickEvent} from "./tick";
import {switchToLatestFrom} from "@scottburch/rxjs-utils";

export type Gun = {
    x: number
    el: JQuery
}

export type GunUpdatedEvent = Msg<'gun-updated',Gun>

const gunWidth = () => (getContainer().width() || 0) * GUN_SIZE
const gunHeight = () => gunWidth() * GUN_ASPECT;
const createGun = () => ({x: .5, el: jq()})

const getGunLeft = (gun: Gun) => ((getContainer().width() || 0) * gun.x) - (gunWidth() / 2)
const getGunTop = () => (getContainer().height() || 0) - gunHeight()

const atRightSide = (gun: Gun) => getGunLeft(gun) + gunWidth() >= (getContainer().width() || 0);
const atLeftSide = (gun: Gun) => getGunLeft(gun) <= 0;

export const getBarrelLocation = pipe(
    map((gun: Gun) => ({x: getGunLeft(gun) + (gunWidth() / 2), y: getGunTop() - gunHeight()}))
);

const renderGun = (gun: Gun) =>
    gun.el = jq('<div id="gun"></div>')
        .css('position', 'absolute')
        .css('background', 'blue')
        .appendTo(getContainer())


const updateGun = (gun: Gun) => {
    gun.el.css('width', gunWidth())
        .css('height', gunHeight())
        .css('left', getGunLeft(gun))
        .css('top', getGunTop());
    sendEvent<GunUpdatedEvent>('gun-updated', gun);
}


const leftArrowState$ = eventListener<KeyEvent>('key-event').pipe(
    filter(msg => msg.key === 'ArrowLeft'),
    map(msg => msg.state)
)

const rightArrowState$ = eventListener<KeyEvent>('key-event').pipe(
    filter(msg => msg.key === 'ArrowRight'),
    map(msg => msg.state)
)

const hookTicker = (gun: Gun) => {
    eventListener<TickEvent>('tick').pipe(
        switchToLatestFrom(leftArrowState$),
        filter((leftArrow) => leftArrow === 'down'),
        filter(() => !atLeftSide(gun)),
        map(() => gun = {...gun, x: gun.x - 0.001}),
        tap(gun => updateGun(gun))
    ).subscribe()

    eventListener<TickEvent>('tick').pipe(
        switchToLatestFrom(rightArrowState$),
        filter((rightArrow) => rightArrow === 'down'),
        filter(() => !atRightSide(gun)),
        map(() => gun = {...gun, x: gun.x +0.001}),
        tap(() => updateGun(gun))
    ).subscribe()
}

const hookWindowResize = (gun: Gun) =>
    eventListener<WindowSizeEvent>('windowResize').subscribe(() => updateGun(gun));


eventListener<WindowSizeEvent>('windowResize').pipe(
    first(),
    map(createGun),
    tap(renderGun),
    tap(updateGun),
    tap(hookWindowResize),
    tap(hookTicker)
).subscribe();
