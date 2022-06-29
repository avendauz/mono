// Digitial pins
int MOTOR_DIRECTION_PIN = 10;
int MOTOR_SPEED_PIN = 11;

// Analog pins
int RUDDER_FEEDBACK_PIN = A0;

int nextRudderPosition = 0;


/********************
** COMMANDS
*********************/
#define SET_RUDDER_CMD 1
#define GET_RUDDER_POSITION 2




void sendCmd(String cmd, String value) {
  Serial.print(cmd);
  Serial.print(":");
  Serial.println(value);  
}

void sendCmd(String cmd, int value) {
    Serial.print(cmd);
    Serial.print(":");
    Serial.println(value);
}

String inStr = "";
char cmd = 0;
void serialEvent() {
  while(Serial.available()) {
    char c = Serial.read();
    if(c == 0) {
      String temp = inStr;
      char tempCmd = cmd;
      inStr = "";
      cmd = 0;
      processCommand(tempCmd, temp);
    } else {
      if(cmd == 0) {
         cmd = c;
      } else {
        inStr += c;
      }
    }
  }
}

void processCommand(char cmd, String val) {
  if(cmd == SET_RUDDER_CMD) {
      setRudder(val);
  } else if(cmd == GET_RUDDER_POSITION) {
      int pos = readRudderPosition();
      sendCmd("RUDDER_POS", pos);
  } else {
    sendCmd("BAD_CMD", String(cmd));
  }


}

void setRudder(String val) {
    int rudder = val.toInt();
    if(rudder == 0) {
       nextRudderPosition = 0;
    } else {
       nextRudderPosition = readRudderPosition() + rudder;
    }
    sendCmd("RUDDER_SET", nextRudderPosition);
}


/******************
** Real work stuff
*******************/



void setup() {
    Serial.begin(57600);
//    while (!Serial) {
//        ; // wait for serial port to connect. Needed for native USB port only
//      }

    // Set PCM frequency
  TCCR1B = (TCCR1B & 0b11111000) | 0x01;
  //TCCR2B = (TCCR2B & 0b11111000) | 0x01;

  pinMode(MOTOR_SPEED_PIN, OUTPUT);
  pinMode(MOTOR_DIRECTION_PIN, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  sendCmd("UP", "");
}


void loop() {
    delay(1);
    motorDriveLoop();
}

void motorDriveLoop() {
    digitalWrite(LED_BUILTIN, LOW);

    if(nextRudderPosition == 0) {
        digitalWrite(MOTOR_SPEED_PIN, LOW);
        return;
    }

    int currentRudderPosition = readRudderPosition();
    digitalWrite(MOTOR_DIRECTION_PIN, currentRudderPosition > nextRudderPosition ? LOW : HIGH);

    // close to location or outside of the rudder range
    if(abs(currentRudderPosition - nextRudderPosition) < 1) {
        digitalWrite(MOTOR_SPEED_PIN, LOW);
        nextRudderPosition = 0;
        return;
    }

    if(currentRudderPosition > 700 && nextRudderPosition > 700) {
        digitalWrite(MOTOR_SPEED_PIN, LOW);
        return;
    }

    if(currentRudderPosition < 300 && nextRudderPosition < 300) {
        digitalWrite(MOTOR_SPEED_PIN, LOW);
        return;
    }
    digitalWrite(LED_BUILTIN, HIGH);
    digitalWrite(MOTOR_SPEED_PIN, HIGH);
}

int readRudderPosition()  {
    return analogRead(RUDDER_FEEDBACK_PIN);
}
