import {DelimiterParser, SerialPort} from 'serialport'
import {BehaviorSubject} from "rxjs";
import {RudderPositionMsg} from "boat-talk/src/messages";
import {sendEvent} from "@scottburch/rxjs-msg-bus";
import {findSerialPort} from "boat-serial/src/findSerialPort";

export const GET_RUDDER_POS = 2;
export const SET_RUDDER = 1;

const portStore = new BehaviorSubject<SerialPort | undefined>(undefined);




export const startSerialPort = () => findSerialPort().then(portStore.next.bind(portStore));


portStore.subscribe(port => {
    port && startCmdListener();

    function startCmdListener() {
        const parser = port?.pipe(new DelimiterParser({delimiter: '\n'}))
        parser?.on('data', x => processCmd.apply(null, x.toString().split(':')));
    }

    return Promise.resolve();
})

function onReady() {
    sendSerialCmd(SET_RUDDER, 0);
}

const processCmd = (cmd: string, data: string) =>
    cmds[cmd] ? cmds[cmd](data) : cmds['LOG'](`unknown cmd: ${cmd}:${data}`);

const cmds: Record<string, (data: string) => void> = {
    RUDDER_POS: (pos) => sendEvent<RudderPositionMsg>('rudder-position', {
        value: parseInt(pos),
        error: ''
    }),
    RUDDER_SET: (pos) => console.log('rudder set', pos),
    UP: () => {
        console.log('serial up');
        onReady()
    },
    LOG: (s) => console.log('log:', s)
}

export const sendSerialCmd = (cmd: number, val?: string | number) => {
        const port = portStore.getValue();
        if (port) {
            port.write(Uint8Array.from([cmd]));
            val && port.write(val.toString());
            port.write(Uint8Array.from([0]));
        }
};


