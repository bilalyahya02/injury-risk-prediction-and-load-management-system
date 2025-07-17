// src/pages/AdminPanel.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();
  const refreshAdminData = async () => {
  try {
    const token = localStorage.getItem("token");
    const [userRes, deviceRes] = await Promise.all([
      axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:5000/api/admin/devices", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    setUsers(userRes.data);
    setDevices(deviceRes.data);
  } catch (err) {
    console.error("Failed to refresh admin data:", err);
  }
};



  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    const fetchData = async () => {
      try {
        const [userRes, deviceRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/admin/devices", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        setUsers(userRes.data);
        setDevices(deviceRes.data);
      } catch (err) {
        console.error("Failed to load admin data:", err);
        navigate("/");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🛠 Admin Panel</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">👤 Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Username</th>
                <th className="p-2 border">Devices</th>

              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={i}>
                   <td className="p-2 border">{user.username}</td>
                    <td className="p-2 border">
  {user.devices?.map((dev, idx) => (
    <span key={idx} className="inline-flex items-center gap-1 mr-2">
      <span>{dev}</span>
      <button
        className="text-red-500 hover:underline text-sm"
        onClick={async () => {
          try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:5000/api/admin/assign", {
              username: user.username,
              device_id: dev,
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            refreshAdminData();  // 🔁 refresh after unassign
          } catch (err) {
            alert("Failed to unassign");
            console.error(err);
          }
        }}
      >
        ❌
      </button>
    </span>
  )) || "-"}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    <div className="mt-10">
  <h3 className="text-xl font-semibold mb-2">➕ Assign Device to User</h3>
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:5000/api/admin/assign", {
          username: e.target.username.value,
          device_id: e.target.device_id.value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Device assigned!");
        e.target.reset();
      } catch (err) {
        console.error("Assignment error:", err);
        alert("Failed to assign device");
      }
        await refreshAdminData(); // Refresh data after assignment
    }}
    className="bg-gray-50 border p-4 rounded w-full max-w-md"
  >
    <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Select User</label>
            <select name="username" required className="w-full p-2 border rounded">
                <option value="">-- Choose User --</option>
                {users.map((u, i) => (
                <option key={i} value={u.username}>{u.username}</option>
                ))}
            </select>
            </div>
            <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Device ID</label>
            <input
                name="device_id"
                placeholder="e.g. leg1"
                required
                className="w-full p-2 border rounded"
            />
            </div>
            <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            >
            Assign Device
            </button>
        </form>
        </div>


      <div>
        <h3 className="text-xl font-semibold mb-2">📟 Devices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Device ID</th>

              </tr>
            </thead>
            <tbody>
              {devices.map((device, i) => (
                <tr key={i}>
                   <td className="p-2 border">{device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
