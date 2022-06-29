import {startBoatTalkNetworkOut} from "boat-talk/src/networkBridge";
import {boatTalkSend} from "boat-talk/src/boatTalk";
import {interval, map, scan, tap} from "rxjs";
import {CompassMsg} from "boat-talk/src/messages";

startBoatTalkNetworkOut('compass');

interval(1000).pipe(
    scan((out) => out + .1, 0),
    map(n => n > 360 ? 0 : n)
).subscribe(n => boatTalkSend<CompassMsg>({
        type: 'ahrs',
        heading: n,
        roll: 0,
        pitch: 0,
        compassTime: 0
    }));

