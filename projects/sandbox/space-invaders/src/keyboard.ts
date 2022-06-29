import {filter, fromEvent, pipe} from "rxjs";
import {Msg, sendEvent} from "@scottburch/rxjs-msg-bus"

export type KeyData = {
    key: string,
    state: 'down' | 'up'
}

export type KeyEvent = Msg<'key-event', KeyData>

fromEvent<KeyboardEvent>(document, 'keydown').subscribe(
    ev => sendEvent<KeyEvent>('key-event',{key: ev.key, state: 'down'})
)

fromEvent<KeyboardEvent>(document, 'keyup').subscribe(
    ev => sendEvent<KeyEvent>('key-event', {key: ev.key, state: 'up'})
);

export const filterKey = (key: string) => pipe(
    filter((data: KeyData) => data.key === key)
)

