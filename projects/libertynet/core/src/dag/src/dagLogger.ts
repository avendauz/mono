import {eventListener} from "@scottburch/rxjs-msg-bus";
import {DagInvalidMessageReceived, DagValidMessageReceived, toHex} from "./dag";
import {tap} from "rxjs";

eventListener<DagValidMessageReceived>('dag.valid-message-received').pipe(
    tap(({msg}) => console.log('Valid message received:', toHex(msg.id)))
).subscribe();

eventListener<DagInvalidMessageReceived>('dag.invalid-message-received').pipe(
    tap(({msg}) => console.log('Invalid message received:', toHex(msg.id)))
).subscribe();