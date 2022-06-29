import {GET_RUDDER_POS, sendSerialCmd, SET_RUDDER, startSerialPort} from "./serial-port";
import {startBoatTalkNetwork} from "boat-talk/src/networkBridge";
import {tap} from "rxjs";
import {CompassDeltaMsg, SetRudderMsg} from "boat-talk/src/messages";
import delay = require("delay");
import {eventListener, sendEvent} from "@scottburch/rxjs-msg-bus";


process.argv[1] === __filename && setTimeout(() => newSerialBridge());

export const newSerialBridge = () => {
    startBoatTalkNetwork('serial-bridge');

    eventListener<SetRudderMsg>("set-rudder").pipe(
        tap(({compassTime}) => sendEvent<CompassDeltaMsg>('compass-delta', {compassDelta: Date.now() - compassTime})),
        tap(({rudder}) => sendSerialCmd(SET_RUDDER, rudder * -1))
    ).subscribe()

    return startSerialPort()
        .then(readRudderPositionLoop);
}




const readRudderPositionLoop = (): Promise<unknown> => {
    sendSerialCmd(GET_RUDDER_POS);
    return delay(500)
        .then(readRudderPositionLoop);
}




