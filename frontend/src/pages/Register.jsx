import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [height_cm, setHeight] = useState("");
  const [weight_kg, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [sport, setSport] = useState("");
  const [fitness_level, setFitness] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        password,
        height_cm,
        weight_kg,
        age,
        gender,
        sport,
        fitness_level
      });
      navigate("/"); // redirect to login
    } catch (err) {
      setError("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-80 space-y-3">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border p-2 rounded" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" />
        <input type="number" placeholder="Height (cm)" value={height_cm} onChange={(e) => setHeight(e.target.value)} className="w-full border p-2 rounded" />
        <input type="number" placeholder="Weight (kg)" value={weight_kg} onChange={(e) => setWeight(e.target.value)} className="w-full border p-2 rounded" />
        <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="w-full border p-2 rounded" />

        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border p-2 rounded">
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select value={sport} onChange={(e) => setSport(e.target.value)} className="w-full border p-2 rounded">
          <option value="">Select Sport</option>
          <option value="football">Football</option>
          <option value="tennis">Tennis</option>
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
        </select>

        <select value={fitness_level} onChange={(e) => setFitness(e.target.value)} className="w-full border p-2 rounded">
          <option value="">Select Fitness Level</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
