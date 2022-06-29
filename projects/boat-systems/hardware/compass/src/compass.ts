import {PromisifiedBus} from "i2c-bus";

//const {sendError, sendInfo} = require('../../network/logSender');
import {curry, memoize} from "lodash";
import {combineLatest, from, interval, map, mergeMap, Subject, Subscription, switchMap, tap} from "rxjs";
import {startBoatTalkNetwork} from "boat-talk/src/networkBridge";
import {CalibrateCompassMsg, CompassMsg} from "boat-talk/src/messages";
import {eventListener, sendEvent} from "@scottburch/rxjs-msg-bus";
import {getI2cBus} from "boat-i2c/src/i2c";

const PERIODIC_AUTOSAVE = 0x10;
const GYRO_CAL_ENABLE = 0x04;
const ACCEL_CAL_ENABLE = 0x02;
const MAG_CAL_ENABLE = 0x01;

const START_CALIBRATION = new Uint8Array([0x98, 0x95, 0x99, 0x80 | ACCEL_CAL_ENABLE | MAG_CAL_ENABLE]);
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

    return getI2cBus()
        .then(pollCompass(pollRate));
}


eventListener<CalibrateCompassMsg>('calibrate-compass').pipe(
    tap(() => writeCommand(START_CALIBRATION))
).subscribe()


const pollCompass = curry((pollRate: number, i2c: PromisifiedBus) => {
    let compassTime = Date.now();
    interval(pollRate).pipe(
        tap(() => compassTime = Date.now()),
        mergeMap(() => readWord(i2c, BEARING).then(heading => ({heading}))),
        mergeMap(ctx => readSigned(i2c, ROLL).then(roll => ({...ctx, roll}))),
        mergeMap(ctx => readSigned(i2c, PITCH).then(pitch => ({...ctx, pitch}))),
        map(ctx => ({...ctx, compassTime})),
    ).subscribe(x => sendEvent<CompassMsg>('compass',x))
});

const writeCommand = (bytes: Uint8Array): Subscription=>
    from(bytes).pipe(
        switchMap(bytes => getI2cBus().then(i2c => ({i2c, bytes}))),
        map(({bytes, i2c}) => i2c.writeByte(CMPS14_ADDR, 0, bytes))
    ).subscribe()


const readWord = (i2c: PromisifiedBus, register: Byte): Promise<Word> =>
    Promise.all([
        i2c.readByte(CMPS14_ADDR, register),
        i2c.readByte(CMPS14_ADDR, register + 1)
    ])
        .then(([high, low]) => ((high << 8) | low) / 10);


const readSigned = async (i2c: PromisifiedBus, register: Byte): Promise<Byte> =>
    i2c.readByte(CMPS14_ADDR, register);
