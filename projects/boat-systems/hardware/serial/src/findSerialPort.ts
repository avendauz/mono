import {readdir} from "fs/promises";
import {find} from "lodash/fp";
import {SerialPort} from "serialport";

export const findSerialPort = (baud: number = 57600) => {
    return readdir('/dev')
        .then(find(name => name.includes('usbmodem') || name.includes('usbserial') || name.includes('ttyUSB')))
        .then(found => found ? found : 'ttyS0')
        .then(path => new SerialPort({
            path: `/dev/${path}`,
            baudRate: baud
        }))
};
