// deviceStateManager.js


const { User } = require("../models/User");
const haversine = require("haversine-distance");

const deviceStates = {};

function updateFromMQTT(deviceId, sensorType, payload) {
  const now = Date.now();

  if (!deviceStates[deviceId]) {
    deviceStates[deviceId] = {
      alerts: [],
      heartRateHistory: [],
      muscleTempHistory: [],
      gpsHistory: [],
      baselineTemps: null,
      totalDistance: 0,
      spo2: null,
      sport: "default", // Can be assigned externally
    };
  }

  const state = deviceStates[deviceId];

  // 1. Acceleration alert
  if (sensorType === "acceleration" && payload.alert === "sudden_acceleration_change") {
  const ts = new Date(payload.timestamp).getTime();
  const accelChange = payload.data?.accel_change;

  state.alerts.push(ts);

  console.log(`🚨 Acceleration alert from ${deviceId}: Δa = ${accelChange}`);
}

  // 2. Heart Rate + SPO2 (MAX30102)
  if (sensorType === "max30102") {
  const hr = payload.data?.heart_rate;
  const spo2 = payload.data?.spo2;

  if (hr !== undefined) {
    state.heartRateHistory.push({ value: hr, ts: now });
  }

  if (spo2 !== undefined) {
    state.spo2 = spo2;
  }
}

  // 3. Muscle + Ambient Temp (MLX90614)
  if (sensorType === "mlx90614") {
    const obj = payload.object_temp;
    const amb = payload.ambient_temp;

    state.muscleTempHistory.push({ object_temp: obj, ambient_temp: amb, ts: now });

    // Set baseline temps if not yet set
    if (!state.baselineTemps) {
      state.baselineTemps = {
        object_temp: obj,
        ambient_temp: amb,
      };
    }
  }

  // 4. GPS
  if (sensorType === "gps" && payload.data?.valid) {
  const { lat, lon } = payload.data;
  const prev = state.gpsHistory[state.gpsHistory.length - 1];
  const curr = { lat, lon, ts: now };
  state.gpsHistory.push(curr);

  if (prev) {
    const dist = haversine(prev, curr);
    state.totalDistance += dist;
  }
}


  // Optional: trim data history to limit memory
  if (state.heartRateHistory.length > 600) state.heartRateHistory.shift();
  if (state.muscleTempHistory.length > 600) state.muscleTempHistory.shift();
  if (state.gpsHistory.length > 600) state.gpsHistory.shift();
}

function buildStats(deviceId) {
  const state = deviceStates[deviceId];
  if (!state) return null;

  const now = Date.now();

  // 1. Sudden Accel Alerts
  const alert_count_60s = state.alerts.filter(ts => ts > now - 60000).length;
  const total_alerts_session = state.alerts.length;

  // 2. Heart rate > 180 in last 60s
  const heartRateAbove180_60s = state.heartRateHistory
    .filter(e => e.ts > now - 60000 && e.value > 180).length;

  // 3. Temperature Drop
  const muscleTempDrop10C =
    state.baselineTemps &&
    state.muscleTempHistory.length &&
    state.muscleTempHistory[state.muscleTempHistory.length - 1].object_temp <=
      state.baselineTemps.object_temp - 10;

  const ambientTempDrop10C =
    state.baselineTemps &&
    state.muscleTempHistory.length &&
    state.muscleTempHistory[state.muscleTempHistory.length - 1].ambient_temp <=
      state.baselineTemps.ambient_temp - 10;

  // 4. Distance Covered (10min)
  const gpsLast10min = state.gpsHistory.filter(p => p.ts > now - 10 * 60 * 1000);
  let distance_covered_10min = 0;
  for (let i = 1; i < gpsLast10min.length; i++) {
    distance_covered_10min += haversine(gpsLast10min[i - 1], gpsLast10min[i]);
  }

  return {
    sport: state.sport,
    alert_count_60s,
    total_alerts_session,
    heartRateAbove180_60s,
    muscleTempDrop10C,
    ambientTempDrop10C,
    spo2: state.spo2,
    distance_covered_10min,
    total_distance_session: state.totalDistance,
  };
}


async function buildUserStats(user) {
  if (!user || !user.devices) return null;

  const merged = {
    sport: user.sport || "default",
    alert_count_60s: 0,
    total_alerts_session: 0,
    heartRateAbove180_60s: 0,
    muscleTempDrop10C: false,
    ambientTempDrop10C: false,
    spo2: null,
    distance_covered_10min: 0,
    total_distance_session: 0,
  };

  for (const deviceId of user.devices) {
    const stats = buildStats(deviceId);
    if (!stats) continue;

    merged.alert_count_60s += stats.alert_count_60s;
    merged.total_alerts_session += stats.total_alerts_session;
    merged.heartRateAbove180_60s += stats.heartRateAbove180_60s;
    merged.distance_covered_10min += stats.distance_covered_10min;
    merged.total_distance_session += stats.total_distance_session;

    if (stats.spo2 !== null && merged.spo2 === null) merged.spo2 = stats.spo2;
    if (stats.muscleTempDrop10C) merged.muscleTempDrop10C = true;
    if (stats.ambientTempDrop10C) merged.ambientTempDrop10C = true;
  }

  return merged;
}


module.exports = {
  updateFromMQTT,
  buildStats,
  buildUserStats,
  deviceStates,
};