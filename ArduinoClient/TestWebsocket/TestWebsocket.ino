#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

const char *ssid = "EnViiAiii";
const char *password = "7654321098";
const char *serverUrl = "http://172.20.10.2:8080/api/events";  

Servo organicServo;
Servo inorganicServo;

unsigned long connectionTimeout = 10000;
unsigned long startTime;
unsigned long lastCheckTime = 0;
const unsigned long checkInterval = 5000;  

const int organicServoPin = 13;
const int inorganicServoPin = 14; 

void setup() {
  Serial.begin(115200);

  if (!setupWifiConnection()) {
    Serial.println("WiFi connection failed. Turning off.");
    delay(1000);
    ESP.deepSleep(0);
  }

  startTime = millis();

  organicServo.attach(organicServoPin);
  organicServo.write(0);  

  inorganicServo.attach(inorganicServoPin);
  inorganicServo.write(0);  
}

bool setupWifiConnection() {
  WiFi.begin(ssid, password);
  unsigned long timeout = millis() + 10000;

  while (WiFi.status() != WL_CONNECTED && millis() < timeout) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("WiFi connection failed. Resetting...");
    return false;
  }
}

void loop() {
  unsigned long currentTime = millis();
  organicServo.write(0);  
  inorganicServo.write(90);  
  if (currentTime - lastCheckTime >= checkInterval) {
    lastCheckTime = currentTime;
    checkForEvents();
  }
}

void checkForEvents() {
  if ((WiFi.status() == WL_CONNECTED)) { 

    HTTPClient http;

    http.begin(serverUrl);  
    int httpCode = http.GET();                                    

    if (httpCode > 0) { 

      String payload = http.getString();
      Serial.println(httpCode);
      Serial.println(payload);

      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
      }

      const char* command = doc["command"];

      if (strcmp(command, "open_organic") == 0) {
        Serial.println("Opening organic door...");
        organicServo.write(90);  
        delay(3000);
        organicServo.write(0);  
        Serial.println("Organic door opened.");
      } else if (strcmp(command, "open_inorganic") == 0) {
        Serial.println("Opening inorganic door...");
        inorganicServo.write(0);  
        delay(3000); 
        inorganicServo.write(90);  
        Serial.println("Inorganic door opened.");
      }

    } else {
      Serial.println("Error on HTTP request");
    }

    http.end(); 
  }
}
