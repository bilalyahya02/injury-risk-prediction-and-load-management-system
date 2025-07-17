#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DFRobot_MAX30102.h>
#include <time.h>

// ====== WiFi & MQTT Settings ======
const char* ssid = "REPLACE_WITH_YOUR_WIFI_SSID"; // e.g., "mywifi"
const char* password = "REPLACE_WITH_YOUR_WIFI_PASSWORD"; // e.g., "mywifi123"
const char* mqtt_server = "REPLACE_WITH_YOUR_MQTT_BROKER_IP"; 
const int mqtt_port = 8883;
const char* mqtt_user = "REPLACE_WITH_YOUR_USERNAME";
const char* mqtt_pass = "REPLACE_WITH_YOUR_PASSWORD";

// === MQTT Topics ===
const char* data_topic = "fyp/wearable/arm2/max30102";
const char* heartbeat_topic = "fyp/wearable/arm2/heartbeat";

// === Objects ===
WiFiClientSecure espClient;
PubSubClient client(espClient);
DFRobot_MAX30102 particleSensor;

// === Sensor Data ===
int32_t SPO2;
int8_t SPO2Valid;
int32_t heartRate;
int8_t heartRateValid;

// === Timers ===
unsigned long lastSensorPublish = 0;
const unsigned long sensorInterval = 4000;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 1000;

// === Get ISO 8601 UTC Timestamp ===
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm* tm_info = gmtime(&now);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", tm_info);
  return String(buffer);
}

// === WiFi Setup ===
void setup_wifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
}

// === MQTT Reconnect ===
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("arm2", mqtt_user, mqtt_pass)) {
      Serial.println("✅ MQTT connected!");
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// === Send Heartbeat ===
void publishHeartbeat() {
  StaticJsonDocument<192> doc;
  doc["device_id"] = "arm2";
  doc["sensor"] = "heartbeat";
  doc["timestamp"] = getTimestamp();

  JsonObject data = doc.createNestedObject("data");
  data["heartbeat"] = "wifi_connected";

  char buffer[192];
  serializeJson(doc, buffer);
  client.publish(heartbeat_topic, buffer);
  Serial.println("❤️ Heartbeat: " + String(buffer));
}

// === Send MAX30102 Data ===
void publishSensorData() {
  particleSensor.heartrateAndOxygenSaturation(&SPO2, &SPO2Valid, &heartRate, &heartRateValid);

  if (SPO2Valid && heartRateValid) {
    StaticJsonDocument<192> doc;
    doc["device_id"] = "arm2";
    doc["sensor"] = "max30102";
    doc["timestamp"] = getTimestamp();

    JsonObject data = doc.createNestedObject("data");
    data["heart_rate"] = heartRate;
    data["spo2"] = SPO2;

    char buffer[192];
    serializeJson(doc, buffer);
    client.publish(data_topic, buffer);
    Serial.println("📡 MAX30102: " + String(buffer));
  } else {
    Serial.println("⚠️ Invalid MAX30102 reading, skipping");
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  espClient.setInsecure();
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  reconnect();

  while (!particleSensor.begin()) {
    Serial.println("❌ MAX30102 not found!");
    delay(1000);
  }

  particleSensor.sensorConfiguration(100, SAMPLEAVG_4, MODE_MULTILED,
                                     SAMPLERATE_100, PULSEWIDTH_411,
                                     ADCRANGE_16384);

  Serial.println("✅ MAX30102 initialized");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();

  if (now - lastSensorPublish >= sensorInterval) {
    lastSensorPublish = now;
    publishSensorData();
  }

  if (now - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = now;
    publishHeartbeat();
  }
}
