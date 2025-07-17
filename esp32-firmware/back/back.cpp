#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

// === GPS Setup ===
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);  // UART2

// ====== WiFi & MQTT Settings ======
const char* ssid = "REPLACE_WITH_YOUR_WIFI_SSID"; // e.g., "mywifi"
const char* password = "REPLACE_WITH_YOUR_WIFI_PASSWORD"; // e.g., "mywifi123"
const char* mqtt_server = "REPLACE_WITH_YOUR_MQTT_BROKER_IP"; //
const int mqtt_port = 8883;
const char* mqtt_user = "REPLACE_WITH_YOUR_USERNAME";
const char* mqtt_pass = "REPLACE_WITH_YOUR_PASSWORD";

// === MQTT Topics ===
const char* gps_topic = "fyp/wearable/back2/gps";
const char* heartbeat_topic = "fyp/wearable/back2/heartbeat";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// === Timing ===
unsigned long lastGpsPublish = 0;
const unsigned long gpsInterval = 1000;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 1000;

unsigned long lastMqttAttempt = 0;
const unsigned long mqttRetryInterval = 5000;

// === Timestamp Helper ===
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm* tm_info = gmtime(&now);
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", tm_info);
  return String(buffer);
}

void setup_wifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  espClient.setInsecure();  // Skip certificate validation
}

void reconnect_mqtt() {
  if (client.connected()) return;
  if (millis() - lastMqttAttempt < mqttRetryInterval) return;

  lastMqttAttempt = millis();
  Serial.print("Connecting to MQTT...");
  String clientId = "back2-" + String(random(1000));
  if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
    Serial.println("✅ MQTT connected");
  } else {
    Serial.print("❌ MQTT failed, rc=");
    Serial.println(client.state());
  }
}

void publishHeartbeat() {
  StaticJsonDocument<192> doc;
  doc["device_id"] = "back2";
  JsonObject data = doc.createNestedObject("data");
  data["heartbeat"] = "wifi_connected";
  doc["timestamp"] = getTimestamp();



  char buffer[192];
  serializeJson(doc, buffer);
  bool ok = client.publish(heartbeat_topic, buffer, false);
  Serial.println(ok ? "❤️ Heartbeat sent" : "❌ Heartbeat failed");
}

void publishGpsData() {
  StaticJsonDocument<192> doc;
  doc["device_id"] = "back2 ";
  doc["sensor"] = "gps";
  doc["timestamp"] = getTimestamp();

  JsonObject data = doc.createNestedObject("data");
  data["lat"] = gps.location.lat();
  data["lon"] = gps.location.lng();
  data["valid"] = gps.location.isValid();

  char buffer[192];
  serializeJson(doc, buffer);
  bool ok = client.publish(gps_topic, buffer, false);
  Serial.println(ok ? "📡 GPS sent: " + String(buffer) : "❌ GPS publish failed");
}

void setup() {
  Serial.begin(115200);
  Serial.println("🚀 Starting GPS + MQTT");

  gpsSerial.begin(9600, SERIAL_8N1, 17, 16);  // RX=17, TX=16 (swapped on your PCB)

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");  // For timestamps
}

void loop() {
  // Decode all available GPS bytes
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Keep MQTT alive and reconnect if needed
  reconnect_mqtt();
  client.loop();

  unsigned long now = millis();

  // Heartbeat every 1s
  if (now - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = now;
    publishHeartbeat();
  }

  // GPS every 1s if valid
  if (gps.location.isValid() && (now - lastGpsPublish >= gpsInterval)) {
    lastGpsPublish = now;
    publishGpsData();
  }
}
