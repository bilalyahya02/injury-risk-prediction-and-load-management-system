#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_MLX90614.h>
#include <ArduinoJson.h>
#include <math.h>
#include <time.h>

// ====== WiFi & MQTT Settings ======
const char* ssid = "REPLACE_WITH_YOUR_WIFI_SSID"; // e.g., "mywifi"
const char* password = "REPLACE_WITH_YOUR_WIFI_PASSWORD"; // e.g., "mywifi123"
const char* mqtt_server = "REPLACE_WITH_YOUR_MQTT_BROKER_IP"; //
const int mqtt_port = 8883;
const char* mqtt_user = "REPLACE_WITH_YOUR_USERNAME";
const char* mqtt_pass = "REPLACE_WITH_YOUR_PASSWORD";

// ====== Topics ======
const char* mpu_topic = "fyp/wearable/leg2/mpu6050";
const char* mlx_topic = "fyp/wearable/leg2/mlx90614";
const char* alert_topic = "fyp/wearable/leg2/alert/acceleration";
const char* heartbeat_topic = "fyp/wearable/leg2/heartbeat";

WiFiClientSecure espClient;
PubSubClient client(espClient);
Adafruit_MPU6050 mpu;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// Timing
unsigned long lastDataPublishTime = 0;
const long dataPublishInterval = 5000;

unsigned long lastMLXReadTime = 0;
const long mlxInterval = 30000;

unsigned long lastAlertTime = 0;
const long alertCooldown = 1000;

unsigned long lastHeartbeatTime = 0;
const long heartbeatInterval = 1000;

float lastAccelMagnitude = 0.0;
const float motionThreshold = 5.0;

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
  espClient.setInsecure();  
}

void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("leg2", mqtt_user, mqtt_pass)) {
      Serial.println("✅ MQTT connected!");
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void publishSensorData() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float accelMagnitude = sqrt(pow(a.acceleration.x, 2) +
                              pow(a.acceleration.y, 2) +
                              pow(a.acceleration.z, 2));
  float accelChange = abs(accelMagnitude - lastAccelMagnitude);
  lastAccelMagnitude = accelMagnitude;

  StaticJsonDocument<384> doc;
  doc["device_id"] = "leg2";
  doc["sensor"] = "mpu6050";
  doc["timestamp"] = getTimestamp();

  JsonObject data = doc.createNestedObject("data");
  data["accel_x"] = a.acceleration.x;
  data["accel_y"] = a.acceleration.y;
  data["accel_z"] = a.acceleration.z;
  data["accel_magnitude"] = accelMagnitude;
  data["accel_change"] = accelChange;

  char buffer[384];
  serializeJson(doc, buffer);
  client.publish(mpu_topic, buffer);
  Serial.println("📡 MPU6050: " + String(buffer));
}

void checkForRapidMovement() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float accelMagnitude = sqrt(pow(a.acceleration.x, 2) +
                              pow(a.acceleration.y, 2) +
                              pow(a.acceleration.z, 2));
  float accelChange = abs(accelMagnitude - lastAccelMagnitude);
  unsigned long currentMillis = millis();

  if (accelChange > motionThreshold && (currentMillis - lastAlertTime > alertCooldown)) {
    lastAlertTime = currentMillis;

    StaticJsonDocument<192> doc;
    doc["device_id"] = "leg2";
    doc["alert"] = "sudden_acceleration_change";
    JsonObject data = doc.createNestedObject("data");
    data["accel_change"] = accelChange;

    doc["timestamp"] = getTimestamp();

  
    char buffer[192];
    serializeJson(doc, buffer);
    client.publish(alert_topic, buffer);
    Serial.println("🚨 Accel Alert: " + String(buffer));
  }
}

void publishMLXTemp() {
  float ambient = mlx.readAmbientTempC();
  float object = mlx.readObjectTempC();

  StaticJsonDocument<192> doc;
  doc["device_id"] = "leg2";
  doc["sensor"] = "mlx90614";
  doc["timestamp"] = getTimestamp();

  JsonObject data = doc.createNestedObject("data");
  data["ambient_temp"] = ambient;
  data["object_temp"] = object;

  char buffer[192];
  serializeJson(doc, buffer);
  client.publish(mlx_topic, buffer);
  Serial.println("🌡️ MLX90614: " + String(buffer));
}

void publishHeartbeat() {
  StaticJsonDocument<192> doc;
  doc["device_id"] = "leg2";
  JsonObject data = doc.createNestedObject("data");
  data["heartbeat"] = "wifi_connected";
  doc["timestamp"] = getTimestamp();

  

  char buffer[192];
  serializeJson(doc, buffer);
  client.publish(heartbeat_topic, buffer);
  Serial.println("❤️ Heartbeat: " + String(buffer));
}

void setup() {
  Serial.begin(115200);
  Wire.begin();

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  if (!mpu.begin()) {
    Serial.println("❌ MPU6050 not detected!");
    while (1);
  }

  if (!mlx.begin()) {
    Serial.println("❌ MLX90614 not detected!");
    while (1);
  }

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  lastAccelMagnitude = sqrt(pow(a.acceleration.x, 2) +
                            pow(a.acceleration.y, 2) +
                            pow(a.acceleration.z, 2));

  Serial.println("✅ Sensors initialized");
}

void loop() {
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();

  unsigned long currentMillis = millis();

  if (currentMillis - lastDataPublishTime >= dataPublishInterval) {
    lastDataPublishTime = currentMillis;
    publishSensorData();
  }

  if (currentMillis - lastMLXReadTime >= mlxInterval) {
    lastMLXReadTime = currentMillis;
    publishMLXTemp();
  }

  if (currentMillis - lastHeartbeatTime >= heartbeatInterval) {
    lastHeartbeatTime = currentMillis;
    publishHeartbeat();
  }

  checkForRapidMovement();
}