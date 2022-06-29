import {filter, first, from, interval, map, pipe, switchMap, tap, timer} from "rxjs";
import {networkInterfaces} from "os";
import {flatten, get} from "lodash/fp";
import {Msg, sendEvent} from "@scottburch/rxjs-msg-bus";
import {startBoatTalkNetwork} from "./networkBridge";
import {hostname} from 'os'

type IamMsg = Msg<'iam', {name: string, address: string}>
startBoatTalkNetwork('iam')

setTimeout(() => {
    process.argv[1] === __filename && startSendIam();
})

const startSendIam = () => {
    interval(5000).pipe(
        switchMap(()  => timer(0).pipe(getMyIp())),
        tap(address => sendEvent<IamMsg>('iam', {name: hostname(), address}))
    ).subscribe();
}

export function getMyIp() { return pipe(
    map(() => networkInterfaces()),
    map(Object.values),
    map(flatten),
    switchMap(from),
    filter(({address}) => address.includes('192.168.1')),
    first(),
    map(get('address'))
)}

