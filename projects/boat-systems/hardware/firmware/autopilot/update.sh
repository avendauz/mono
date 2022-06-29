#!/bin/bash
echo '****** Dump Prefs *******'
/Applications/Arduino.app/Contents/Java/arduino-builder \
-dump-prefs \
-logger=machine \
-hardware /Applications/Arduino.app/Contents/Java/hardware \
-hardware /Users/scott/Library/Arduino15/packages \
-tools /Applications/Arduino.app/Contents/Java/tools-builder \
-tools /Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-tools /Users/scott/Library/Arduino15/packages \
-built-in-libraries /Applications/Arduino.app/Contents/Java/libraries \
-libraries /Users/scott/Documents/Arduino/libraries \
-fqbn=arduino:avr:pro:cpu=8MHzatmega328 \
-vid-pid=2341_0043 \
-ide-version=10819 \
-build-path build \
-warnings=none \
-build-cache cache \
-prefs=build.warn_data_percentage=75 \
-prefs=runtime.tools.avr-gcc.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.avr-gcc-7.3.0-atmel3.6.1-arduino7.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.avrdude.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.avrdude-6.3.0-arduino17.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.arduinoOTA.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.arduinoOTA-1.3.0.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-verbose src/arduino.ino


echo '****** COMPILE *******'
/Applications/Arduino.app/Contents/Java/arduino-builder \
-compile \
-logger=machine \
-hardware /Applications/Arduino.app/Contents/Java/hardware \
-hardware /Users/scott/Library/Arduino15/packages \
-tools /Applications/Arduino.app/Contents/Java/tools-builder \
-tools /Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-tools /Users/scott/Library/Arduino15/packages \
-built-in-libraries /Applications/Arduino.app/Contents/Java/libraries \
-libraries /Users/scott/Documents/Arduino/libraries \
-fqbn=arduino:avr:pro:cpu=8MHzatmega328 \
-vid-pid=2341_0043 \
-ide-version=10819 \
-build-path ./build \
-warnings=none \
-build-cache ./cache \
-prefs=build.warn_data_percentage=75 \
-prefs=runtime.tools.avr-gcc.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.avr-gcc-7.3.0-atmel3.6.1-arduino7.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.avrdude.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.avrdude-6.3.0-arduino17.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.arduinoOTA.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-prefs=runtime.tools.arduinoOTA-1.3.0.path=/Applications/Arduino.app/Contents/Java/hardware/tools/avr \
-verbose ./src/arduino.ino

echo "******* avrdude *********"
/Applications/Arduino.app/Contents/Java/hardware/tools/avr/bin/avrdude \
-C /Applications/Arduino.app/Contents/Java/hardware/tools/avr/etc/avrdude.conf \
-v -v \
-patmega328p \
-carduino \
-P/dev/cu.usbmodem141101 \
-b57600 \
-D \
-Uflash:w:build/arduino.ino.hex:i