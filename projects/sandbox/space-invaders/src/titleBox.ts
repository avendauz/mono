import jq from "jquery";
import {eventListener} from "@scottburch/rxjs-msg-bus";
import {RunningEvent} from "./running";

jq('#title')
    .css('position', 'absolute')
    .css('top', 100)
    .css('left', 100)
    .css('text-align', 'center')
    .css('background', 'white')
    .css('border', '1px solid #888')
    .css('padding', 20)

eventListener<RunningEvent>('is-running')
    .subscribe(isRunning => isRunning ? jq('#title').hide() : jq('#title').show())