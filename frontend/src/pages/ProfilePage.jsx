import { useState, useEffect } from "react";
import axios from "axios";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/user/profile", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => setProfile(res.data))
    .catch(() => setMessage("Failed to load profile."));
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await axios.put("http://localhost:5000/api/user/profile", profile, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMessage("✅ Profile updated successfully.");
    } catch (err) {
      setMessage("❌ Failed to update profile.");
    }

    setSaving(false);
  };

  if (!profile) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-lg rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Edit Injury Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="number" name="height_cm" value={profile.height_cm || ""} onChange={handleChange} placeholder="Height (cm)" className="w-full border p-2 rounded" />
        <input type="number" name="weight_kg" value={profile.weight_kg || ""} onChange={handleChange} placeholder="Weight (kg)" className="w-full border p-2 rounded" />
        <input type="number" name="age" value={profile.age || ""} onChange={handleChange} placeholder="Age" className="w-full border p-2 rounded" />

        <select name="gender" value={profile.gender || ""} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select name="sport" value={profile.sport || ""} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Select Sport</option>
          <option value="football">Football</option>
          <option value="tennis">Tennis</option>
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
        </select>

        <select name="fitness_level" value={profile.fitness_level || ""} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Select Fitness Level</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <h3 className="text-lg font-semibold mt-4">Previous Injuries (last 15 weeks)</h3>

        {(profile.previous_injuries || []).map((injury, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Body Part"
              value={injury.body_part}
              onChange={(e) => {
                const updated = [...profile.previous_injuries];
                updated[index].body_part = e.target.value;
                setProfile({ ...profile, previous_injuries: updated });
              }}
              className="w-1/2 border p-2 rounded"
            />

            <input
              type="number"
              placeholder="Weeks Ago"
              value={injury.weeks_ago}
              onChange={(e) => {
                const updated = [...profile.previous_injuries];
                updated[index].weeks_ago = e.target.value;
                setProfile({ ...profile, previous_injuries: updated });
              }}
              className="w-1/3 border p-2 rounded"
            />

            <button
              type="button"
              onClick={() => {
                const updated = [...profile.previous_injuries];
                updated.splice(index, 1);
                setProfile({ ...profile, previous_injuries: updated });
              }}
              className="bg-red-500 text-white px-2 rounded"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            const updated = [...(profile.previous_injuries || [])];
            updated.push({ body_part: "", weeks_ago: "" });
            setProfile({ ...profile, previous_injuries: updated });
          }}
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          ➕ Add Injury
        </button>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}
