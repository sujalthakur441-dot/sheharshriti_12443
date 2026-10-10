import { useCallback, useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api/departments";

const DEPARTMENTS = [
  { code: "ROAD", name: "Roads & Infrastructure Department" },
  { code: "WASTE", name: "Waste Management Department" },
  { code: "WATER", name: "Water Supply Department" },
  { code: "ELEC", name: "Electrical & Street Lighting Department" },
  { code: "DRAIN", name: "Drainage & Sewerage Department" },
  { code: "TRANSIT", name: "Public Transport Department" },
  { code: "EV", name: "EV & Urban Mobility Infrastructure Department" },
  { code: "GENERAL", name: "Civic Infrastructure & General Services Department" },
];

function asText(value, keys = []) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    for (const key of keys) {
      if (value[key] !== undefined && value[key] !== null) return asText(value[key], keys);
    }
    return "—";
  }
  return String(value);
}

function DepartmentDashboard() {
  const [departmentCode, setDepartmentCode] = useState("ROAD");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedDepartment = DEPARTMENTS.find((item) => item.code === departmentCode) || DEPARTMENTS[0];

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(departmentCode)}/dashboard`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      console.error("Department dashboard loading failed:", err);
      setDashboard(null);
      setError("Unable to load this department's dashboard. Check that the backend is running, then try Refresh.");
    } finally {
      setLoading(false);
    }
  }, [departmentCode]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.statistics || {};
  const incidents = Array.isArray(dashboard?.incidents) ? dashboard.incidents : [];

  return (
    <main className="department-dashboard-page">
      <header className="department-dashboard-header">
        <div>
          <p className="dashboard-label">SHEHARSHRITI CIVICOS</p>
          <h1>Department Dashboard</h1>
          <p>{selectedDepartment.name}</p>
        </div>
        <label className="department-switcher-label">
          <span className="sr-only">Select department</span>
          <select
            className="department-code-badge department-selector"
            value={departmentCode}
            onChange={(event) => setDepartmentCode(event.target.value)}
            aria-label="Select department"
          >
            {DEPARTMENTS.map((department) => (
              <option key={department.code} value={department.code}>
                {department.code}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && (
        <div role="alert" className="department-error">
          <p>{error}</p>
          <button type="button" className="department-action-button" onClick={loadDashboard}>Try Again</button>
        </div>
      )}

      <section className="department-stat-grid" aria-label="Department statistics">
        {[
          ["Total Incidents", stats.total_incidents],
          ["High Priority", stats.high_priority],
          ["New Reports", stats.new_incidents],
          ["Active", stats.active_incidents],
          ["Resolved", stats.resolved_incidents],
        ].map(([label, value]) => (
          <div className="department-stat-card" key={label}>
            <span>{label}</span>
            <strong>{loading ? "…" : (value ?? 0)}</strong>
          </div>
        ))}
      </section>

      <section className="department-incidents-section">
        <div className="section-heading">
          <div>
            <h2>Assigned Incidents</h2>
            <p>Incidents routed to {selectedDepartment.name}</p>
          </div>
          <button type="button" className="department-action-button" onClick={loadDashboard} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="empty-incidents"><p>Loading department incidents…</p></div>
        ) : !error && incidents.length === 0 ? (
          <div className="empty-incidents">
            <h3>No incidents assigned</h3>
            <p>New incidents routed to this department will appear here.</p>
          </div>
        ) : (
          <div className="incident-list">
            {incidents.map((incident, index) => {
              const severity = asText(incident.severity, ["level", "severity", "label", "name", "value"]).toLowerCase();
              const routing = incident.routing || incident.ai_analysis || {};
              return (
                <article className="department-incident-card" key={incident.incident_id || index}>
                  <div className="incident-card-top">
                    <div>
                      <span className="incident-id">{asText(incident.incident_id)}</span>
                      <h3>{asText(incident.title, ["title", "name", "value"])}</h3>
                    </div>
                    <span className={`severity-badge ${severity}`}>{severity === "—" ? "Unspecified" : severity}</span>
                  </div>
                  <p className="incident-description">{asText(incident.description, ["description", "text", "value"])}</p>
                  <div className="incident-meta">
                    <span>📍 {asText(incident.location, ["address", "name", "value"])}</span>
                    <span>🏷️ Category: {asText(incident.category, ["category", "name", "value"])}</span>
                    <span>📌 Status: {asText(incident.status, ["status", "label", "name", "value"])}</span>
                  </div>
                  <div className="incident-routing">
                    <strong>AI Routing</strong>
                    <span>{asText(routing.reason, ["reason", "message", "value"]) === "—" ? "Routing information available" : asText(routing.reason, ["reason", "message", "value"])}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default DepartmentDashboard;
