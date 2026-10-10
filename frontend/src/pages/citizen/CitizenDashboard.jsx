
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  MapPin,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import RoleLayout from "../../layouts/RoleLayout";

const API = "http://127.0.0.1:8000";

function CitizenDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/reports/`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch {
      setError("Could not load reports. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const statusOf = (report) =>
    String(report.work_status || report.status || "Reported").toLowerCase();

  const inProgress = reports.filter((r) =>
    statusOf(r).includes("progress")
  ).length;

  const resolved = reports.filter((r) =>
    ["completed", "work completed", "resolved"].includes(statusOf(r))
  ).length;

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleString();
  };

  return (
    <RoleLayout role="citizen">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CITIZEN WORKSPACE</span>
          <h1>Citizen Dashboard</h1>
          <p>Track civic reports and monitor their progress.</p>
        </div>

        <button
          className="primary-action"
          onClick={() => navigate("/citizen/report")}
        >
          <MapPin size={18} /> Report an Issue
        </button>
      </div>

      {error && (
        <div className="content-card" role="alert">
          <p>{error}</p>
          <button className="text-action" onClick={loadReports}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle size={27} /></div>
          <div><span>Total Reports</span><strong>{loading ? "—" : reports.length}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={27} /></div>
          <div><span>In Progress</span><strong>{loading ? "—" : inProgress}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle size={27} /></div>
          <div><span>Resolved</span><strong>{loading ? "—" : resolved}</strong></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><MapPin size={27} /></div>
          <div><span>Other Reports</span><strong>{loading ? "—" : Math.max(0, reports.length - inProgress - resolved)}</strong></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="content-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">LIVE API DATA</span>
              <h2>Recent Reports</h2>
            </div>
            <button className="text-action" onClick={loadReports}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading reports…</p>
          ) : reports.length === 0 ? (
            <div className="report-list">
              <p>No reports found yet. Submit your first civic issue.</p>
              <button className="primary-action" onClick={() => navigate("/citizen/report")}>
                Report an Issue
              </button>
            </div>
          ) : (
            <div className="report-list">
              {[...reports].reverse().slice(0, 8).map((report) => (
                <div className="report-item" key={report.incident_id}>
                  <div className="report-item-icon"><AlertTriangle size={19} /></div>
                  <div className="report-item-content">
                    <strong>{report.title || report.category || "Civic issue"}</strong>
                    <span>
                      {report.location || "Location unavailable"} · {formatDate(report.created_at)}
                    </span>
                    <span>Incident: {report.incident_id}</span>
                  </div>
                  <span className={`status-badge ${statusOf(report).includes("completed") || statusOf(report) === "resolved" ? "resolved" : "progress"}`}>
                    {report.work_status || report.status || "Reported"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">QUICK ACTIONS</span>
              <h2>Stay Involved</h2>
            </div>
          </div>
          <div className="facility-list">
            <div className="facility-item">
              <div className="facility-icon"><MapPin size={18} /></div>
              <div>
                <strong>Report an issue</strong>
                <span>Submit a civic problem for routing.</span>
              </div>
              <button className="text-action" onClick={() => navigate("/citizen/report")} aria-label="Report an issue">
                <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="facility-item">
              <div className="facility-icon"><RefreshCw size={18} /></div>
              <div>
                <strong>Refresh report status</strong>
                <span>Retrieve the latest data from the backend.</span>
              </div>
              <button className="text-action" onClick={loadReports} aria-label="Refresh reports">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <p className="eyebrow">Report counts reflect all reports available in the current backend session.</p>
        </section>
      </div>
    </RoleLayout>
  );
}

export default CitizenDashboard;