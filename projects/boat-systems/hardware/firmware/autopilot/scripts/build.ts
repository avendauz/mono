import {exec} from '@scottburch/exec'

setTimeout(() => build());

const build = () =>
    exec`arduino-cli compile  --fqbn arduino:avr:pro:cpu=8MHzatmega328 arduino/arduino.ino`
