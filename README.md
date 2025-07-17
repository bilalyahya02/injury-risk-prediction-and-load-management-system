# 🦵 Real-Time Injury Risk Prediction and Load Management System

Real-Time Injury Risk Prediction and Load Management System is a wearable solution designed to predict and prevent non-contact sports injuries by continuously tracking physiological and biomechanical data. Built using 3 custom ESP32-based wearable devices with various sensors, a Node.js backend, and a React dashboard, this system enables real-time athlete monitoring with live injury risk scoring.

Developed as part of my individual final year MEng project in Electronic and Information Engineering at Imperial College London, achieving a score of 80.75%.

---
## Wearable Devices
Each unit was designed to monitor specific data in real time:

<table>
  <tr>
    <td align="center"><strong>Arm Unit</strong><br>Heart Rate + SpO₂<br><img src="https://github.com/user-attachments/assets/ee3b4cc5-a15c-43cf-8fcd-6d5e749bad97" width="400"/></td>
    <td align="center"><strong>Back Unit</strong><br>GPS Location<br><img src="https://github.com/user-attachments/assets/3c17d2b2-0551-4cdd-a901-c008cbe05614" width="400"/></td>
    <td align="center"><strong>Leg Unit</strong><br>Acceleration + Muscle Temp<br><img src="https://github.com/user-attachments/assets/96eee1e9-b106-4657-be2e-c218168348f6" width="400"/></td>
  </tr>
</table>

## Website Demo

🎥 Watch the system in action:

https://github.com/user-attachments/assets/f5e0d46f-fde6-4d39-a7e1-b16c98d52d11

🌐 [Live Dashboard](https://injury-monitoring.vercel.app/)

Log on with **Username: Demo** and **Password: demo** to see the various pages, e.g. profile and live dashboard.

Note: The dashboard will load without data, but you will **not** see live sensor values unless the physical devices are connected and transmitting.

Features shown in the demo:
- Real-time sensor data updates
- Injury risk scoring logic
- GPS path tracking
- Device connectivity indicators




## 📁 Repository Structure

```
injury-risk-predicition-and-load-management-system/
├── esp32-firmware/ # Embedded C++ firmware for ESP32 wearables
│ ├── leg/ # MPU6050 (IMU) + MLX90614 (IR temp)
│ ├── arm/ # MAX30102 (heart rate & SpO₂)
│ └── back/ # NEO-6M GPS module
├── backend/ # Node.js + MQTT/WebSocket backend for data ingestion & risk scoring
├── frontend/ # React dashboard for real-time monitoring and visualisation
└── README.md
```

## 🧰 Tech Stack

- **Firmware**: ESP32 (C++)
- **Backend**: Node.js, MQTT, WebSockets
- **Frontend**: React.js, Vite
- **Data Protocol**: JSON over MQTT/WebSocket



---


## 🛠 Setup & Usage Guide

### 1. Requirements

Before starting, ensure you have:

- Wearable devices 
- Arduino IDE or PlatformIO (for firmware)
- Node.js (v16+)
- npm or yarn
- MQTT Broker (e.g., HiveMQ Cloud or Mosquitto)
- Git

---

### 2. ESP32 Firmware Setup

📁 Location: `esp32-firmware/`

Each folder (`leg`, `arm`, `back`) contains a `.cpp` file for the corresponding device.

Steps:
1. Open the file in Arduino IDE or PlatformIO.
2. Replace placeholder WiFi & MQTT values.
3. Install libraries:
   - `Wire`, `WiFi`, `WiFiClientSecure`, `PubSubClient`
   - `Adafruit_MPU6050`, `Adafruit_MLX90614`, `DFRobot_MAX30102`
   - `TinyGPS++`, `ArduinoJson`
4. Upload to each ESP32 device.

Each device publishes:
- **Leg**: Acceleration, muscle temperature, alerts, heartbeat
- **Arm**: Heart rate, SpO₂, heartbeat
- **Back**: GPS coordinates, heartbeat

---

### 3. Backend Setup

📁 Location: `backend/`

```bash
cd backend
npm install
node server.js
```


- Connects to MQTT broker to receive sensor data
- Emits data via WebSocket to frontend
- Calculates real-time injury risk scores
---

### 4. Frontend Setup
📁 Location: frontend/

```bash
cd frontend
npm install
npm run dev
```
- Starts a React SPA
- Connects to backend via WebSocket
- Displays:
  - Real-time charts (HR, SpO2, accel, temp)
  - GPS path + distance travelled
  - Risk score
  - Device status indicators













