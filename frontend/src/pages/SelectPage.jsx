import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function SelectPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // ✅ fallback

  useEffect(() => {
    axios.get("/api/user/profile", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {
      console.log("🧠 User profile:", res.data);
      setUser(res.data);
    })
    .catch(err => {
      console.error("❌ Failed to load profile", err);
      navigate("/login");
    });
  }, []);

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>

      <button onClick={() => navigate("/profile")} className="bg-blue-500 text-white px-4 py-2 rounded">
        Edit Profile
      </button>

      <button onClick={() => navigate("/dashboard")} className="bg-green-500 text-white px-4 py-2 rounded">
        Go to Dashboard
      </button>

      {isAdmin && (
        <button onClick={() => navigate("/admin")} className="bg-red-500 text-white px-4 py-2 rounded">
          Admin Panel
        </button>
      )}
    </div>
  );
}
