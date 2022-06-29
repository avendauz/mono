import {exec} from '@scottburch/exec'
import {Gpio} from "onoff"
import delay from 'delay'

setTimeout(() => doUpload());

const doUpload = () => {
    const reset = new Gpio(5, 'out');
    reset.write(Gpio.LOW)
        .then(() => {
            exec`arduino-cli upload -v --fqbn --fqbn arduino:samd:nano_33_iot -p /dev/ttyS0 ${__dirname}../arduino/arduino.ino --discovery-timeout 20s --verify`.toPromise()
        })
        .then(() => delay(17_000))
        .then(() => reset.write(Gpio.HIGH))
}
