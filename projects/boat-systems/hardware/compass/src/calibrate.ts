import {CalibrateCompassMsg, startBoatTalkNetwork} from "boat-talk";
import {sendEvent} from "@scottburch/rxjs-msg-bus";

startBoatTalkNetwork('compass-calibrate');

sendEvent<CalibrateCompassMsg>('calibrate-compass');

