// src/pages/SelectRole.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SelectRole() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!token || !isAdmin) navigate("/");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-2xl font-bold">Welcome, Admin</h2>
      <p>Select where you want to go:</p>
      <div className="flex gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => navigate("/admin")}
        >
          Go to Admin Panel
        </button>
      </div>
    </div>
  );
}

export default SelectRole;
