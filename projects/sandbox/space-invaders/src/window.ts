import {fromEvent, throttleTime} from "rxjs";
import {sendEvent} from "@scottburch/rxjs-msg-bus";

export type WindowSizeEvent = {type: 'windowResize', data:{height: number, width: number}};


const sendWindowSize = () => sendEvent<WindowSizeEvent>('windowResize', {height: window.innerHeight, width: window.innerWidth});

setTimeout(sendWindowSize)

fromEvent(window, 'resize').pipe(
    throttleTime(30 )
).subscribe(sendWindowSize);

