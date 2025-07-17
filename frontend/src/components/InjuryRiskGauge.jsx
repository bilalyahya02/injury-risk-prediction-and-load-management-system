// components/InjuryRiskGauge.jsx

import GaugeChart from "react-gauge-chart";

function InjuryRiskGauge({ score, label = "Injury Risk" }) {
  let color = "#00FF00"; // Very Low
  if (score >= 85) color = "#FF0000"; // Very High
  else if (score >= 60) color = "#FF6347"; // High
  else if (score >= 35) color = "#FFA500"; // Moderate
  else if (score >= 20) color = "#9ACD32"; // Low

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full max-w-md">
        <GaugeChart
          id={`gauge-chart-${label}`}
          nrOfLevels={20}
          percent={Math.min(score, 100) / 100}
          colors={["#00FF00", "#9ACD32", "#FFA500", "#FF6347", "#FF0000"]}
          arcWidth={0.3}
          textColor="#000000"
          needleColor="#000000"
        />
      </div>
      <p className="font-semibold">{label}: {score} / 100</p>
    </div>
  );
}

export default InjuryRiskGauge;
