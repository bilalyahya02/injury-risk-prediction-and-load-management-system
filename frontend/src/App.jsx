import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";  
import AdminPanel from "./pages/AdminPanel";
import SelectRole from "./pages/SelectRole";
import SelectPage from "./pages/SelectPage";
import ProfilePage from "./pages/ProfilePage";  

// Placeholder dashboard for now
function DashboardPlaceholder() {
  return (
    <div className="p-8 text-center text-xl font-semibold text-gray-700">
      ✅ Login successful — dashboard coming soon.
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/select" element={<SelectPage />} />
        <Route path="/profile" element={<ProfilePage />} />

      </Routes>
    </Router>
  );
}

export default App;
