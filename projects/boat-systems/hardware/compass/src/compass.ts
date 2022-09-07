import {PromisifiedBus} from "i2c-bus";

//const {sendError, sendInfo} = require('../../network/logSender');
import {curry, memoize} from "lodash";
import {
    bufferTime,
    combineLatest, concatMap, debounceTime, delay,
    from,
    interval,
    map,
    mergeMap,
    of,
    Subject,
    Subscription,
    switchMap,
    tap, throttleTime,
    timer,
    withLatestFrom
} from "rxjs";
import {startBoatTalkNetwork} from "boat-talk/src/networkBridge";
import {CalibrateCompassMsg, CompassCalibrationStateMsg, CompassMsg} from "boat-talk/src/messages";
import {eventListener, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {getI2cBus} from "boat-i2c/src/i2c";

const PERIODIC_AUTOSAVE = 0x10;
const GYRO_CAL_ENABLE = 0x04;
const ACCEL_CAL_ENABLE = 0x02;
const MAG_CAL_ENABLE = 0x01;

const START_CALIBRATION = [0x98, 0x95, 0x99, 0x80 | ACCEL_CAL_ENABLE | MAG_CAL_ENABLE | PERIODIC_AUTOSAVE];
const STOP_CALIBRATION = [0x98, 0x95, 0x99, 0x80];
const STORE_PROFILE = [0xF0, 0xF5, 0xF6];
const ERASE_STORED_PROFILE = [0xe0, 0xe5, 0xe2];
const CMPS14_ADDR = 0x60;
const BEARING = 0x02;
const ROLL = 0x05;
const PITCH = 0x04;
const CALIBRATION_STATE = 0x1e;
let isCalibrating = false;

type Byte = number;
type Word = number;


setTimeout(() => process.argv[1] === __filename && startCompass());

export const startCompass = (pollRate: number = 100) => {
    console.log('Starting compass...');

    startBoatTalkNetwork('compass');

    interval(pollRate).pipe(
        switchMap(() => readCompass()),
        bufferTime(2000),
        switchMap(() => readCalibration())
    ).subscribe()
}


eventListener<CalibrateCompassMsg>('calibrate-compass').pipe(
    tap(() => writeCommand(START_CALIBRATION))
).subscribe()


const readCompass = () => {
    let compassTime = Date.now();
    return timer(0).pipe(
        tap(() => compassTime = Date.now()),
        switchMap(() => from(getI2cBus()).pipe(
            switchMap(i2c => readWord(i2c, BEARING).pipe(map(heading => ({heading}))))
        )),
        switchMap(ctx => from(getI2cBus()).pipe(
            switchMap(i2c => readByte(ROLL).pipe(map(roll => ({...ctx, roll})))),
        )),
        switchMap(ctx => from(getI2cBus()).pipe(
            switchMap(i2c => readByte(PITCH).pipe(map(pitch => ({...ctx, pitch}))))
        )),
        map(ctx => ({...ctx, compassTime})),
        tap(readings => sendEvent<CompassMsg>('compass', readings))
    )
};

const readCalibration = () =>
    readByte(CALIBRATION_STATE).pipe(
        map(state => ({
            mag: state & 0x03,
            accel: (state & 0x0c) >> 2,
            gyro: (state & 0x30) >> 4,
            cmps: (state & 0xc0) >> 6,
            raw: state.toString(16)
        })),
        tap(sendEventPartial<CompassCalibrationStateMsg>('compass-calibration-state'))
    )

const writeCommand = (bytes: number[]) => {
    console.log("writing to compass", bytes);
    from(bytes).pipe(
        concatMap(n => of(n).pipe(
            concatMap(byte => getI2cBus().then(i2c => i2c.writeByte(CMPS14_ADDR, 0, byte)).catch(e => console.log(e))),
            delay(20)
        ))
    ).subscribe(() => console.log('wrote command to compass', bytes));
}


const readWord = (i2c: PromisifiedBus, register: Byte) =>
    from(i2c.readByte(CMPS14_ADDR, register)).pipe(
    switchMap(() => i2c.readByte(CMPS14_ADDR, register)),
    withLatestFrom(i2c.readByte(CMPS14_ADDR, register + 1)),
    map(([high, low]) => ((high << 8) | low) / 10)
)


const readByte = (register: Byte) =>
    from(getI2cBus()).pipe(
        switchMap(i2c => i2c.readByte(CMPS14_ADDR, register))
    )
