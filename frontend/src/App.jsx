import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/public/Home";
import Login from "./pages/auth/Login";

import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ReportIssue from "./pages/citizen/ReportIssue";

import DepartmentDashboard from "./pages/department/DepartmentDashboard";

import FieldTeamDashboard from "./pages/field-team/FieldTeamDashboard";

import OversightDashboard from "./pages/oversight/OversightDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Home */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Citizen */}
        <Route
          path="/citizen"
          element={<CitizenDashboard />}
        />

        <Route
          path="/citizen/dashboard"
          element={<CitizenDashboard />}
        />

        <Route
          path="/citizen/report"
          element={<ReportIssue />}
        />

        {/* Department */}
        <Route
          path="/department"
          element={<DepartmentDashboard />}
        />

        <Route
          path="/department/dashboard"
          element={<DepartmentDashboard />}
        />

        {/* Field Team */}
        <Route
          path="/field-team"
          element={<FieldTeamDashboard />}
        />

        <Route
          path="/field-team/dashboard"
          element={<FieldTeamDashboard />}
        />

        {/* Central Oversight */}
        <Route
          path="/oversight"
          element={<OversightDashboard />}
        />

        <Route
          path="/oversight/dashboard"
          element={<OversightDashboard />}
        />

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;