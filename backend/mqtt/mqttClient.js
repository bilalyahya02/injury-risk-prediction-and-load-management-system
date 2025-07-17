

const mqtt = require("mqtt");
const { io } = require("../server");
const Data = require("../models/Data");
const { mqttBroker } = require("../config");
const User = require("../models/User");
const RiskLog = require("../models/RiskLog"); 

const {
  updateFromMQTT,
  buildStats,
  buildUserStats
} = require("../logic/deviceStateManager");

const {
  calculateBaseRisk,
  calculateLiveRisk,
  classifyRisk
} = require("../logic/injuryRisk");

const client = mqtt.connect(mqttBroker, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

client.on("connect", () => {
  console.log("📡 Connected to MQTT broker");
  client.subscribe("fyp/wearable/#");
});

client.on("message", async (topic, message) => {
  try {
    console.log("🔔 MQTT message received:", topic);

    const parts = topic.split("/");
    if (parts.length < 4 || parts[0] !== "fyp" || parts[1] !== "wearable") return;

    const deviceId = parts[2];
    const channel = parts[3];
    const subChannel = parts[4] || null;
    const payload = JSON.parse(message.toString());

    if (channel === "heartbeat") {
      io.emit(`data/${deviceId}/heartbeat`, payload);
      console.log(`🟢 Emitted: data/${deviceId}/heartbeat`);
      return;
    }

    // Update internal state
    if (channel === "alert" && subChannel === "acceleration") {
      updateFromMQTT(deviceId, "acceleration", payload);
    } else if (!subChannel) {
      updateFromMQTT(deviceId, channel, payload);
    }

    // Store to DB
    await Data.create({
      device_id: deviceId,
      sensor: subChannel || channel,
      timestamp: new Date(payload.timestamp || Date.now()),
      data: payload.data || payload
    });

    // Emit raw data
    io.emit(`data/${deviceId}`, {
      device_id: deviceId,
      sensor: subChannel || channel,
      data: payload.data || payload,
      timestamp: payload.timestamp || Date.now()
    });

    console.log(`📤 Emitted: data/${deviceId} from topic ${subChannel || channel}`);

    // === Build user-level risk ===

    console.log("🧪 Is User defined?", typeof User);
    console.log("🧪 Devices being searched for user:", deviceId);

    const user = await User.findOne({ devices: { $in: [deviceId] } });
    console.log("🧪 User found:", user ? user.username : "No user found for device");

    if (!user) return;

    console.log("✅ 1. Found user:", user.username);
const stats = await buildUserStats(user);
console.log("✅ 2. Built stats:", stats);

if (!stats) {
  console.warn("⚠️ No stats returned for user.");
  return;
}

  const baseRisk = calculateBaseRisk(user);
  console.log("✅ 3. Base risk:", baseRisk);

  const liveRisk = calculateLiveRisk(stats);
  console.log("✅ 4. Live risk:", liveRisk);

  const finalRisk = Math.round((baseRisk * liveRisk) * 100) / 100;

  const riskLevel = classifyRisk(finalRisk);

  console.log("🧮 Final injury score = Base:", baseRisk, "× Live:", liveRisk, "=", finalRisk);

  // send risk data to mongoDB
  await RiskLog.create({
    username: user.username,
    baseRisk,
    liveRisk,
    finalRisk,
    stats,
  });


  // Emit risk data to user-specific channel
  io.emit(`risk/${user.username}`, {
    username: user.username,
    base_risk: baseRisk,
    live_risk: liveRisk,
    final_risk: finalRisk,
    risk_level: riskLevel,
    stats
  });


    console.log(`📐 Base Risk Value: ${baseRisk}`);
    console.log(`📥 Merged Stats for ${user.username}:`, stats);
    console.log(`🩹 Injury Risk: ${finalRisk} (${riskLevel})`);
    console.log(`👤 Risk calculated for user: ${user.username}`);
  } catch (err) {
    console.error("⚠️ MQTT Handler Error:", err.message);
  }
});
