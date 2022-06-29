/**
 * Sketch for Arduino Nano 33 IoT
 *
 * Connects to WiFi network and uses UDP to send
 * onboard sensor data.
 *
 * Sensors: 3D Gyro and 3D accelerometer (6 values)
 * Sensor values are Floats cast to a byte array.
 * They must be recast to Float on the remote device
 * receiving the UDP data.
 *
 * This is to connect with a JUCE application running on my laptop:
 * https://github.com/RFullum/MastersProject1
 */

#include <WiFiNINA.h>         // Wifi library
#include <WiFiUdp.h>          // UDP library



// WiFi variables
char ssid[] = "RainbirdI";        //  ENTER Wifi SSID (network name) BETWEEN QUOTES
char pass[] = "HFQsIduda";        // ENTER Wifi password BETWEEN QUOTES

int TEMP_SENSOR = A0;
int VOLTS = A1;

int status = WL_IDLE_STATUS;      // Status of WiFi connection

WiFiSSLClient client;             // Instantiate the Wifi client


// UDP Variables
const char* computerIP = "224.0.0.1";
const unsigned int port = 5010;

WiFiUDP Udp;                          // Instantiate UDP class


void setup()
{
  // Check for Wifi Module. If no module, don't continue
  if (WiFi.status() == WL_NO_MODULE) {
    while (true);
  }

  // Connect to Wifi Access Point
  connectToAP();

  // UDP Connect with report via serial
  Udp.begin(5010);
}



void loop()
{

   analogRead(TEMP_SENSOR);
   sendBoatTalk(formatUdpString("engine_temp", analogRead(TEMP_SENSOR)));
   delay(50);
   analogRead(VOLTS);
   sendBoatTalk(formatUdpString("volts", analogRead(VOLTS)));
   delay(1000);
}

void sendBoatTalk(String msg) {
  Udp.beginPacket(computerIP, port);

  byte msg_bytes[msg.length() + 1];
  msg.getBytes(msg_bytes, msg.length()+1);
  Udp.write(msg_bytes, msg.length());
  Udp.endPacket();
}



String formatUdpString(String name, float value) {
    String msg = "{'event': {'type': '{name}', 'data': {'raw': {raw}, 'volts': {volts}}}}";
    msg.replace("'", "\"");
    msg.replace("{name}", name);
    msg.replace("{raw}", String(value));
    msg.replace("{volts}", String(value * (3.3 / 1024) * 4.703));

    return msg;
}



// Connect to wifi network
void connectToAP() {
  // Try to connect to Wifi network
  while ( status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);

    // wait 1 second for connection:
    delay(1000);
  }
}



