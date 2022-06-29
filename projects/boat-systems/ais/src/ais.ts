import {findSerialPort} from "boat-serial/src/findSerialPort";
import {map, switchMap, tap, timer} from "rxjs";
import {DelimiterParser} from "serialport";
import {eventListener, sendEvent} from "@scottburch/rxjs-msg-bus";
import {AisMsg, startBoatTalkNetwork} from "boat-talk";
import dgram from "dgram";
import {memoize} from "lodash";


timer(1).pipe(
    tap(() => startBoatTalkNetwork('ais')),
    switchMap(() => findSerialPort(38400)),
    map(serial => serial.pipe(new DelimiterParser({delimiter: '\r\n'}))),
    tap(parser => parser.on('data', data => sendEvent<AisMsg>('ais', {nema: data.toString()})))
).subscribe()

const getUdpSocket = memoize(() =>
    dgram.createSocket({
        type: 'udp4',
        reuseAddr: true
    })
)

eventListener<AisMsg>('ais').subscribe(({nema}) => getUdpSocket().send(nema, 2000,'224.0.0.1'))