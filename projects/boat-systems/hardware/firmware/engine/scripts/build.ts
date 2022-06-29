import {exec} from '@scottburch/exec'

setTimeout(() => build());

const build = () =>
    exec`arduino-cli compile  --fqbn arduino:samd:nano_33_iot  ${__dirname}/../arduino/arduino.ino`
