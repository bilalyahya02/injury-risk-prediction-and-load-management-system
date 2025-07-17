

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import GaugeChart from 'react-gauge-chart';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  PolarAngleAxis,
  
} from "recharts";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

const socket = io("http://localhost:5000");

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState({ leg: "", arm: "", back: "" });
  const [liveData, setLiveData] = useState({});
  const [chartData, setChartData] = useState({});
  const [heartbeatStatus, setHeartbeatStatus] = useState({});
  const [sensorStatus, setSensorStatus] = useState({});
  const [totalAccelAlerts, setTotalAccelAlerts] = useState(0);

  // const [riskData, setRiskData] = useState({});
  // const [userRisk, setUserRisk] = useState(null);

  const [riskData, setRiskData] = useState({});




  const chartBuffer = useRef({});
  const lastHeartbeat = useRef({});
  const lastSensorData = useRef({});
  const prevGPS = useRef({});
  const gpsHistory = useRef({});
  const distanceTravelled = useRef({});
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    axios.get("http://localhost:5000/api/devices", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDevices(res.data.devices))
      .catch(() => navigate("/"));
  }, []);

  useEffect(() => {
    const types = ["leg", "arm", "back"];
    types.forEach(type => {
      const id = selected[type];
      if (!id) return;

      socket.on(`data/${id}/heartbeat`, () => {
        lastHeartbeat.current[id] = Date.now();
      });

      socket.on(`data/${id}`, (msg) => {
        const timestamp = new Date().toLocaleTimeString();
        const flatData = msg.data || msg;

        lastSensorData.current[id] = Date.now();

        setLiveData(prev => {
          const merged = {
            ...prev[id]?.data,
            ...flatData
          };
          return {
            ...prev,
            [id]: {
              ...msg,
              data: merged
            }
          };
        });

        const trackedKeys = {
          accel_magnitude: "accel_magnitude",
          object_temp: "object_temperature",
          heart_rate: "heart_rate",
          spo2: "blood_oxygen"
        };

        Object.entries(trackedKeys).forEach(([incomingKey, chartKey]) => {
          if (flatData[incomingKey] !== undefined) {
            const buffer = chartBuffer.current[id + "_" + chartKey] || [];
            const newEntry = {
              time: timestamp,
              [chartKey]: flatData[incomingKey]
            };
            chartBuffer.current[id + "_" + chartKey] = [...buffer.slice(-29), newEntry];
            setChartData(prev => ({
              ...prev,
              [id + "_" + chartKey]: [...chartBuffer.current[id + "_" + chartKey]]
            }));
          }
        });

        if (flatData.lat && flatData.lon) {
          const curr = { lat: flatData.lat, lon: flatData.lon };
          const prev = prevGPS.current[id];
          if (prev) {
            const d = haversine(prev.lat, prev.lon, curr.lat, curr.lon);
            distanceTravelled.current[id] = (distanceTravelled.current[id] || 0) + d;
          }
          prevGPS.current[id] = curr;
          const history = gpsHistory.current[id] || [];
          gpsHistory.current[id] = [...history, curr].slice(-100);
        }
      });

      socket.on(`risk/${id}`, (msg) => {
        setRiskData(prev => ({ ...prev, [id]: msg }));
      });
    });

    return () => {
      types.forEach(type => {
        const id = selected[type];
        if (id) {
          socket.off(`data/${id}`);
          socket.off(`data/${id}/heartbeat`);
          socket.off(`risk/${id}`);
        }
      });
    };
  }, [selected]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newHeartbeat = {};
      const newSensor = {};
      Object.values(selected).forEach(id => {
        if (!id) return;
        newHeartbeat[id] = now - (lastHeartbeat.current[id] || 0) < 30000;
        newSensor[id] = now - (lastSensorData.current[id] || 0) < 30000;
      });
      setHeartbeatStatus(newHeartbeat);
      setSensorStatus(newSensor);
    }, 1000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
  const username = localStorage.getItem("username");

  const handleRiskUpdate = (payload) => {
    setRiskData(prev => ({
      ...prev,
      [payload.username]: {
        final_risk: payload.base_risk * payload.live_risk,
        risk_level: payload.risk_level,
        base_risk: payload.base_risk,
        
      }
    }));
  };

  socket.on(`risk/${username}`, handleRiskUpdate);

  return () => {
    socket.off(`risk/${username}`, handleRiskUpdate);
  };
}, []);


useEffect(() => {
  const username = localStorage.getItem("username");

  const handleAlertCount = (payload) => {
    const count = payload.stats?.total_alerts_session;
    if (typeof count === "number") {
      setTotalAccelAlerts(count);
    }
  };

  socket.on(`risk/${username}`, handleAlertCount);

  return () => {
    socket.off(`risk/${username}`, handleAlertCount);
  };
}, []);






  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = deg => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const InjuryRiskGauge = ({ risk }) => {
  const percentage = Math.min(risk * 25, 100); // Convert 0–4 scale to 0–100
  const riskLabel =
    risk < 1.5 ? "🟢 Low" : risk < 2.5 ? "🟡 Moderate" : "🔴 High";

  const data = [
    {
      name: "Risk",
      value: percentage,
      fill: risk >= 3 ? "#ff4d4f" : risk >= 2 ? "#faad14" : "#52c41a"
    }
  ];

  return (
    <div className="relative w-48 h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            clockWise
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Centered risk number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{risk.toFixed(2)}</span>
        <span className="text-sm">{riskLabel}</span>
      </div>
    </div>
  );
};


  
  const renderRiskGauge = (id) => {
    const risk = riskData[id];
    if (!risk) return <p className="text-gray-400 italic">No risk data</p>;

    return (
      <div className="my-4">
        <h4 className="text-sm font-medium mb-1">Injury Risk</h4>
        <GaugeChart
          id={`risk-gauge-${id}`}
          nrOfLevels={20}
          percent={Math.min(risk.finalRisk / 10, 1)}
          textColor="#000"
          colors={["#00FF00", "#FFBF00", "#FF0000"]}
          formatTextValue={() => risk.riskLabel || "—"}
        />
        <p className="text-sm mt-2">Base Risk: {risk.baseRisk}</p>
      </div>
    );
  };

  const renderStatus = (id) => (
  <div className="flex flex-col gap-1 mb-2 text-sm">
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${heartbeatStatus[id] ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span>WiFi Connection</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${sensorStatus[id] ? 'bg-green-500' : 'bg-red-500'}`}></span>
      <span>Sensor Data</span>
    </div>
  </div>
);

const renderLineChart = (chartId, label, color = "#3b82f6") => {
  const data = chartData[chartId] || [];
  const key = chartId.split("_").slice(1).join("_");

  if (!data.length) return <p className="text-gray-400 italic">No {label} data</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey={key} stroke={color} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const renderMap = (id) => {
  const gps = liveData[id]?.data || {};
  if (!gps.lat || !gps.lon) return <p className="text-gray-400 italic">No GPS data</p>;

  const position = [gps.lat, gps.lon];
  const distance = distanceTravelled.current[id]?.toFixed(2) || "0.00";



  return (
    <div className="w-full h-64">
      <MapContainer center={position} zoom={18} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>📍 Device Location<br />📏 {distance} meters moved</Popup>
        </Marker>
        {gpsHistory.current[id] && gpsHistory.current[id].length > 1 && (
          <Polyline positions={gpsHistory.current[id].map(p => [p.lat, p.lon])} />
        )}
      </MapContainer>
      <p className="text-sm mt-2">📏 Distance moved: {distance} meters</p>
    </div>
  );
};

const renderDualChart = (id, key1, key2) => {
  const data1 = chartData[id + "_" + key1] || [];
  const data2 = chartData[id + "_" + key2] || [];
  const merged = data1.map((d, i) => ({
    time: d.time,
    [key1]: d[key1],
    [key2]: data2[i]?.[key2],
  }));

  if (!merged.length) return <p className="text-gray-400 italic">No dual data</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={merged}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey={key1} stroke="#ef4444" dot={false} />
        <Line type="monotone" dataKey={key2} stroke="#10b981" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};



const renderSection = (label, type, sensors, isMap = false) => {
    const id = selected[type];

    return (
      <div className="bg-white p-4 rounded shadow w-full md:w-1/3">
        <h3 className="text-xl font-bold mb-2">{label} Device</h3>
        <select
          className="border w-full p-2 rounded mb-3"
          value={id}
          onChange={e => setSelected(prev => ({ ...prev, [type]: e.target.value }))}
        >
          <option value="">Select {label.toLowerCase()} device</option>
          {devices.filter(d => d.startsWith(type)).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {id ? (
  <>
    {renderStatus(id)}

    {isMap
      ? renderMap(id)
      : sensors.map(({ key, label, color }, idx) =>
          key.includes("/") ? (
            renderDualChart(id, ...key.split("/"))
          ) : (
            <div key={idx} className="mb-2">
              <h4 className="text-sm font-medium mb-1">{label}</h4>
              {renderLineChart(id + "_" + key, label, color)}
            </div>
          )
        )
    }

    {/* ✅ Add this block here to show alert count under the graph */}
    {type === "leg" && (
      <p className="text-sm mt-2 text-red-600 font-semibold">
        Total Sudden Acceleration Changes: {totalAccelAlerts}
      </p>
    )}

    {/* <pre className="text-xs bg-gray-100 p-2 rounded mt-3">
      {liveData[id] ? JSON.stringify(liveData[id].data || {}, null, 2) : "Waiting for data..."}
    </pre> */}
  </>
) : (
  <p className="text-gray-400 italic">No device selected</p>
)}
      </div>
    );
  };


const renderRiskSection = () => {
  const username = localStorage.getItem("username");
  if (!username || !riskData[username]) return null;

  const risk = riskData[username].final_risk || 0;
  const level = riskData[username].risk_level || "N/A";
  const maxRisk = 10;
  const percentage = Math.min((risk / maxRisk) * 100, 100);

  return (
    <div className="bg-white p-4 rounded shadow w-full md:w-1/3">
      <h3 className="text-xl font-bold mb-4">🩹 Injury Risk</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="absolute" viewBox="0 0 36 36">
            <path
              className="text-gray-300"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className="text-blue-500"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeDasharray={`${percentage}, 100`}
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{risk.toFixed(1)}</span>
            <span className="text-sm text-gray-600">{level}</span>
          </div>
          
        </div>
        <p className="text-sm text-gray-500 mt-2">Live Injury Risk</p>
      </div>
    </div>
  );
};

return (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
  📊 Injury Monitoring Dashboard
  {username && (
    <span className="text-lg font-medium text-gray-600">
      | Logged in as <span className="text-blue-600">{username}</span>
    </span>
  )}
</h2>
    <div className="flex flex-col md:flex-row flex-wrap gap-6">
      {renderSection("Leg", "leg", [
        { key: "accel_magnitude", label: "Acceleration Magnitude", color: "#3b82f6" },
        { key: "object_temperature", label: "Muscle Temperature", color: "#f97316" }
      ])}
      {renderSection("Back", "back", [], true)}
      {renderSection("Arm", "arm", [
        { key: "heart_rate/blood_oxygen", label: "Heart Rate / SpO2" }
      ])}
      {renderRiskSection()}
    </div>
  </div>
);
}






export default Dashboard;
