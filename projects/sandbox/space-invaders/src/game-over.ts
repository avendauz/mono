import {eventListener, Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {AlienCreatedEvent, AlienDestroyedEvent, AlienUpdatedEvent} from "./alien";
import {filter, map, merge, scan, skip, tap} from "rxjs";
import {calculateTop, getContainer, gridSize} from "./alien-render";
import {ALIEN_SIZE} from "./settings";
import jq from "jquery";


export type GameOverEvent = Msg<'game-over', boolean>

const isAtBottom = (top: number) => top + (gridSize() * ALIEN_SIZE) >= (getContainer().height() || 0);

// check if game over when all aliens destroyed
merge(
    eventListener<AlienCreatedEvent>('alien-created').pipe(map(() => 1)),
    eventListener<AlienDestroyedEvent>('alien-destroyed').pipe(map(() => -1))
).pipe(
    scan((total, change) => total + change, 0),
    filter(total => total === 0),
    tap(() => sendEvent<GameOverEvent>('game-over', true))
).subscribe()

// check if game over if aliens reach bottom
eventListener<AlienUpdatedEvent>('alien-updated').pipe(
    map(calculateTop),
    filter(isAtBottom),
    tap(() => sendEvent<GameOverEvent>('game-over', true))
).subscribe();


sendEvent<GameOverEvent>('game-over', false);
const getGameOver = () => jq('#game-over');
getGameOver().hide();

eventListener<GameOverEvent>('game-over').subscribe(isOver => isOver && getGameOver().show());
