
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import RoleLayout from "../../layouts/RoleLayout";

const API = "http://127.0.0.1:8000";

function OversightDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/oversight/dashboard`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setDashboard(data);
    } catch {
      setError("Unable to load oversight data. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.statistics || {};
  const incidents = dashboard?.recent_incidents || [];
  const departments = dashboard?.department_counts || {};

  return (
    <RoleLayout role="oversight">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CENTRAL GOVERNANCE</span>
          <h1>Civic Command Center</h1>
          <p>Monitor incidents, department workloads, evidence and citizen disputes.</p>
        </div>
        <button className="primary-action" onClick={loadDashboard}>
          <RefreshCw size={17} /> Refresh Data
        </button>
      </div>

      {error && (
        <section className="content-card" role="alert">
          <p>{error}</p>
          <button className="text-action" onClick={loadDashboard}>Try again</button>
        </section>
      )}

      <div className="stats-grid">
        <Stat
          icon={<AlertTriangle size={25} />}
          label="Total Incidents"
          value={loading ? "—" : stats.total_incidents ?? 0}
        />
        <Stat
          icon={<Building2 size={25} />}
          label="Completed Incidents"
          value={loading ? "—" : stats.completed_incidents ?? 0}
        />
        <Stat
          icon={<ClipboardList size={25} />}
          label="In Progress"
          value={loading ? "—" : stats.in_progress_incidents ?? 0}
        />
        <Stat
          icon={<ShieldCheck size={25} />}
          label="Incidents Requiring Review"
          value={loading ? "—" : stats.incidents_with_alerts ?? 0}
        />
      </div>

      <div className="content-grid">
        <section className="content-card">
          <div className="card-heading">
            <div>
              <h2>Recent Incidents</h2>
              <p>Latest incidents returned by the oversight API</p>
            </div>
          </div>

          {loading ? (
            <p>Loading incidents…</p>
          ) : incidents.length === 0 ? (
            <p>No incidents are available yet.</p>
          ) : (
            <div className="review-list">
              {incidents.map((incident) => (
                <div className="review-item" key={incident.incident_id}>
                  <div className="review-indicator" />
                  <div>
                    <strong>{incident.title || incident.incident_id}</strong>
                    <span>
                      {incident.incident_id} · {incident.department || "Unassigned"}
                    </span>
                    <span>
                      {incident.location || "Location unavailable"} · Status:{" "}
                      {incident.work_status || incident.status || "Reported"}
                    </span>
                    {incident.alerts?.length > 0 && (
                      <span>
                        Attention: {incident.alerts.join("; ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <h2>Department Workload</h2>
              <p>Incident counts grouped by department</p>
            </div>
          </div>

          {loading ? (
            <p>Loading department statistics…</p>
          ) : Object.keys(departments).length === 0 ? (
            <p>No department data available yet.</p>
          ) : (
            <div className="health-list">
              {Object.entries(departments).map(([department, count]) => (
                <div className="health-item" key={department}>
                  <span>{department}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}

          <div className="health-list">
            <div className="health-item">
              <span>Pending citizen disputes</span>
              <strong>{loading ? "—" : stats.pending_disputes ?? 0}</strong>
            </div>
            <div className="health-item">
              <span>Evidence awaiting review</span>
              <strong>{loading ? "—" : stats.pending_evidence_reviews ?? 0}</strong>
            </div>
            <div className="health-item">
              <span>Completed without evidence</span>
              <strong>{loading ? "—" : stats.completed_without_evidence ?? 0}</strong>
            </div>
          </div>
        </section>
      </div>

      {dashboard?.generated_at && (
        <p className="eyebrow">
          Last data refresh: {new Date(dashboard.generated_at).toLocaleString()}
        </p>
      )}
    </RoleLayout>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default OversightDashboard;