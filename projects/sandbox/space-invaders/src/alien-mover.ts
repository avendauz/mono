import {ALIEN_SIZE, GRID_SIZE_X} from "./settings";
import {BehaviorSubject} from "rxjs";
import {Alien} from "./alien";
import {Msg, sendEvent} from "@scottburch/rxjs-msg-bus";


export type AlienDownEvent = Msg<'alien-down', {}>
type MovementFn = (alien: Alien) => unknown;


const moveRight = (alien: Alien) => {
    alien.x += 1;
    alien.x + ALIEN_SIZE === GRID_SIZE_X && setTimeout(() => movement$.next(moveDown(moveLeft)))
};
const moveLeft = (alien: Alien) => {
    alien.x -= 1;
    alien.x === 0 && setTimeout(() => movement$.next(moveDown(moveRight)))
}
const moveDown = (nextMovement: MovementFn) => (alien: Alien) => {
    alien.y += 1;
    sendEvent<AlienDownEvent>('alien-down', {});
    setTimeout(() => movement$.next(nextMovement))
};

export const movement$ = new BehaviorSubject<(alien: Alien) => void>(moveRight)