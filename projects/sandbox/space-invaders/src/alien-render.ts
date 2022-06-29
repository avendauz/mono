import {ALIEN_SIZE, GRID_SIZE_X} from "./settings";
import jq from "jquery";
import {memoize} from "lodash";
import {Alien, AlienCreatedEvent} from "./alien";
import {map, pipe, tap} from "rxjs";
import {eventListener, sendEventPartial} from "@scottburch/rxjs-msg-bus";

const renderAlienContainer = pipe(
    map((alien: Alien) => ({
        ...alien,
        el: jq(`<div></div>`)
            .css('position', 'absolute')
            .css('background', 'red')
            .css('border', '1px solid white')
            .appendTo(getContainer())
    }))
);

export const rerenderAlien = pipe(
    tap((alien: Alien) =>
        alien.el
            .css('height', getAlienSize())
            .css('width', getAlienSize())
            .css('top', calculateTop(alien))
            .css('left', calculateLeft(alien))
    )
);

export const getAlienSize = () => gridSize() * ALIEN_SIZE
export const getContainer = memoize(() => jq('#container'))
const areaWidth = () => getContainer().width() || 0
export const gridSize = () => areaWidth() / GRID_SIZE_X;
export const calculateTop = (alien: Alien) => gridSize() * alien.y;
export const calculateLeft = (alien: Alien) => gridSize() * alien.x;

eventListener<AlienCreatedEvent>('alien-created').pipe(
    renderAlienContainer,
    rerenderAlien,
    tap(sendEventPartial('alien-rendered'))
).subscribe();
