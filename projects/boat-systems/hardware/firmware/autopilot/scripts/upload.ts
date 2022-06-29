import {exec} from '@scottburch/exec'
import {Gpio} from "onoff"
import delay from 'delay'

setTimeout(() => doUpload());

const doUpload = () => {
    const reset = new Gpio(5, 'out');
    reset.write(Gpio.LOW)
        .then(() => {
            exec`arduino-cli upload -v --fqbn arduino:avr:pro:cpu=8MHzatmega328 -p /dev/ttyS0 arduino/arduino.ino --discovery-timeout 20s --verify`.toPromise()
        })
        .then(() => delay(17_000))
        .then(() => reset.write(Gpio.HIGH))
}
