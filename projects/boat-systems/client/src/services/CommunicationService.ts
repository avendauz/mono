import {webSocket} from "rxjs/webSocket";
import {map, tap} from "rxjs";
import {bind} from "@react-rxjs/core";
import {
    AutopilotStatusMsg, CalibrateCompassMsg, CompassCalibrationStateMsg,
    CompassDeltaMsg,
    CompassMsg,
    EngineOilPressMsg,
    EngineTempMsg,
    RudderPositionMsg,
    SetRudderMsg
} from "boat-talk";
import {eventListener, Msg, sendEvent} from "@scottburch/rxjs-msg-bus";


const ws = webSocket<Msg<unknown, unknown>>(`ws://${window.location.hostname}:5010`);


ws.pipe(
    tap(ws => sendEvent(ws.type, ws.data))
).subscribe()

export const [useCompass] = bind(eventListener<CompassMsg>('compass'), {compassTime: 0, heading: 0, pitch: 0, roll: 0})


export const [useAutopilotStatus] = bind(eventListener<AutopilotStatusMsg>('autopilot-status'), {} as AutopilotStatusMsg['data']);

export const [useRudderPosition] = bind(eventListener<RudderPositionMsg>('rudder-position').pipe(
        map(msg => 1024 - msg.value)
    ), 0
);

export const [useCompassCalibration] = bind(eventListener<CompassCalibrationStateMsg>('compass-calibration-state'));


export const [useCompassDelta] = bind(eventListener<CompassDeltaMsg>('compass-delta'), {compassDelta: 0});

export const [useSetRudder] = bind(eventListener<SetRudderMsg>('set-rudder'), {rudder: 0, compassTime: 0});


export const [useEngineTemp] = bind(eventListener<EngineTempMsg>('engine-temp'), 0);
export const [useEngineOilPres] = bind(eventListener<EngineOilPressMsg>('engine-oil-pres'), 0);


 export const sendToServer = <T extends Msg<T['type'], T['data']>>(data: Msg<T['type'], T['data']>): void =>
    ws.next(data);


