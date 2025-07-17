// logic/injuryRisk.js

// === SPORT THRESHOLDS ===
const sportThresholds = {
  football: {
    expectedDistancePerMin: 75,
    totalDistanceThreshold: 5000,
    totalAccelAlertThreshold: 100
  },
  tennis: {
    expectedDistancePerMin: 75,
    totalDistanceThreshold: 5000,
    totalAccelAlertThreshold: 100
  },
  default: {
    expectedDistancePerMin: 75,
    totalDistanceThreshold: 5000,
    totalAccelAlertThreshold: 100
  }
};

// === FITNESS MULTIPLIERS ===
const fitnessMultipliers = {
  low: 1.2,
  medium: 1.0,
  high: 0.85
};

// === PREVIOUS INJURY MULTIPLIERS ===
const injuryRiskMap = {
  hamstring: 2.3,
  acl: 4.5,
  ankle: 1.5,
  achilles: 1.8,
  generic: 1.2
};

// === BASE RISK CALCULATION ===
function calculateBaseRisk(profile) {
  let risk = 1.0;

  // BMI
  if (profile.height_cm && profile.weight_kg) {
    const bmi = profile.weight_kg / ((profile.height_cm / 100) ** 2);
    if (bmi < 18.5 || bmi > 30) risk *= 1.4;
    else if (bmi > 25) risk *= 1.2;
  }

  // Age
  if (profile.age && profile.age > 18) {
    const years = profile.age - 18;
    const rate = profile.gender === "female" ? 1.03 : 1.05;
    risk *= Math.pow(rate, years);
  }

  // Gender
  if (profile.gender === "male") {
    risk *= 1.25;
  }

  // Fitness
  risk *= fitnessMultipliers[profile.fitness_level] || 1.0;

  // Previous Injuries
  if (Array.isArray(profile.previous_injuries)) {
    for (const injury of profile.previous_injuries) {
      if (injury.weeks_ago !== undefined && injury.weeks_ago <= 15) {
        const key = injury.body_part?.toLowerCase() || "generic";
        risk *= injuryRiskMap[key] || injuryRiskMap["generic"];
      }
    }
  }

  return Math.round(risk * 100) / 100;
}

function calculateLiveRisk(stats) {
  let score = 0;

  // 1. Sudden Acceleration Alerts (last 60s)
  if (stats.alert_count_60s >= 10) score += 2;
  else if (stats.alert_count_60s >= 5) score += 1;

  // 2. Heart Rate > 180 bpm (duration-based over last 60s)
  if (stats.heartRateAbove180_60s >= 6) score += 2;
  else if (stats.heartRateAbove180_60s >= 3) score += 1;

  // 3. Temperature Drop (ambient and muscle)
  if (stats.ambientTempDrop10C) score += 1;
  if (stats.muscleTempDrop10C) score += 2;

  // 4. SpO2 Risk
  if (stats.spo2 !== undefined) {
    if (stats.spo2 < 92) score += 2;
    else if (stats.spo2 < 95) score += 1;
  }

  // 5. Distance Overload (last 10 mins, sport-specific)
  if (stats.distance_covered_10min !== undefined && stats.sport) {
    const thresholdPerMin = sportThresholds[stats.sport]?.expectedDistancePerMin || 80;
    const expectedDistance = thresholdPerMin * 10;

    if (stats.distance_covered_10min >= expectedDistance * 1.2) score += 2;
    else if (stats.distance_covered_10min >= expectedDistance) score += 1;
  }

  // 6. Session Load (total distance or alert overload)
  const sport = stats.sport || "default";
  const sportConfig = sportThresholds[sport] || sportThresholds.default;

  if (
    stats.total_distance_session !== undefined &&
    stats.total_distance_session >= sportConfig.totalDistanceThreshold
  ) {
    score += 1;
  }

  if (
    stats.total_alerts_session !== undefined &&
    stats.total_alerts_session >= sportConfig.totalAccelAlertThreshold
  ) {
    score += 1;
  }

  // Final multiplier output
  const multiplier = 1 + score * 0.2;
  return Math.round(multiplier * 100) / 100;
}

// === RISK CLASSIFICATION ===
function classifyRisk(finalRisk) {
  if (finalRisk < 3.9) return "Low";
  if (finalRisk < 6.5) return "Moderate";
  if (finalRisk < 9.0) return "High";
  return "Very High";
}

// === EXPORTS ===
module.exports = {
  sportThresholds,
  calculateBaseRisk,
  calculateLiveRisk,
  classifyRisk
};
