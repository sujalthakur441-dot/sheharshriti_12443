import { useEffect, useState } from "react";
import RoleLayout from "../../layouts/RoleLayout";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const DEFAULT_TEAM = "ROAD-TEAM-01";

function display(value, keys = []) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value !== "object") return String(value);
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null) return display(value[key], keys);
  }
  return "—";
}

async function readResponse(response, fallback) {
  let result = {};
  try { result = await response.json(); } catch { /* response may not be JSON */ }
  if (!response.ok) {
    const detail = typeof result.detail === "string"
      ? result.detail
      : result.detail?.message || result.message || fallback;
    throw new Error(detail);
  }
  return result;
}

export default function FieldTeamDashboard() {
  const [teams, setTeams] = useState([]);
  const [teamCode, setTeamCode] = useState(DEFAULT_TEAM);
  const [data, setData] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState({});

  // Load the team list once. Changing teamCode never resets the selection.
  useEffect(() => {
    let cancelled = false;
    async function fetchTeams() {
      setTeamsLoading(true);
      try {
        const response = await fetch(`${API}/api/field-teams/`);
        const result = await readResponse(response, "Could not load field teams.");
        const list = Array.isArray(result.field_teams) ? result.field_teams : [];
        if (!cancelled) {
          setTeams(list);
          setTeamCode((current) => list.some((team) => team.code === current) ? current : (list[0]?.code || ""));
          if (!list.length) setError("The backend returned no field teams.");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not connect to the backend.");
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    }
    fetchTeams();
    return () => { cancelled = true; };
  }, []);

  // Whenever the user selects a different team, load only that team's dashboard.
  useEffect(() => {
    if (!teamCode) return undefined;
    let cancelled = false;
    async function fetchDashboard() {
      setLoading(true);
      setError("");
      setData(null);
      try {
        const response = await fetch(`${API}/api/field-teams/${encodeURIComponent(teamCode)}/dashboard`);
        const result = await readResponse(response, "Could not load this team's jobs.");
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message || "Backend is unavailable. Make sure FastAPI is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [teamCode]);

  async function refreshDashboard() {
    if (!teamCode) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/field-teams/${encodeURIComponent(teamCode)}/dashboard`);
      setData(await readResponse(response, "Could not refresh this team's jobs."));
    } catch (err) {
      setError(err.message || "Could not refresh the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function updateJob(job, status, progress) {
    setBusyId(job.incident_id);
    setError("");
    try {
      const response = await fetch(`${API}/api/field-teams/jobs/${encodeURIComponent(job.incident_id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          progress,
          note: notes[job.incident_id]?.trim() || `Field team updated job to ${status}.`,
        }),
      });
      await readResponse(response, "Could not update job status.");
      await refreshDashboard();
    } catch (err) {
      setError(err.message || "Job update failed.");
    } finally {
      setBusyId("");
    }
  }

  const stats = data?.statistics || {};
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return (
    <RoleLayout role="field-team"><div className="field-page">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 26 }}>
        <div>
          <span className="eyebrow">SHEHARSHRITI · CIVIC OPERATIONS</span>
          <h1 style={{ margin: "10px 0 6px", fontSize: "clamp(25px, 4vw, 32px)", fontWeight: 800 }}>Field Team Dashboard</h1>
          <div style={{ color: "var(--ink-soft)" }}>{data?.team?.name || teams.find((team) => team.code === teamCode)?.name || "Choose a field team"}</div>
        </div>
        <button className="field-btn" onClick={refreshDashboard} disabled={loading || !teamCode}>{loading ? "Refreshing…" : "Refresh Jobs"}</button>
      </header>

      <section className="field-card" style={{ marginBottom: 20 }}>
        <label htmlFor="field-team-select" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Switch Field Team</label>
        <select id="field-team-select" value={teamCode} onChange={(event) => setTeamCode(event.target.value)} className="field-select" disabled={teamsLoading || teams.length === 0}>
          {teamsLoading && <option value={teamCode}>Loading teams…</option>}
          {!teamsLoading && teams.length === 0 && <option value="">No teams available</option>}
          {teams.map((team) => <option key={team.code} value={team.code}>{team.name} — {team.code}</option>)}
        </select>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 0 }}>Choose Road, Waste, Water, or Electricity. The dashboard below reloads for the selected team.</p>
      </section>

      {error && <div role="alert" className="field-card field-alert" style={{ marginBottom: 20 }}><strong>Dashboard message:</strong> {error}</div>}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 14, marginBottom: 26 }}>
        {[["Total Jobs", stats.total_jobs], ["Assigned", stats.assigned_jobs], ["Accepted", stats.accepted_jobs], ["Active", stats.active_jobs], ["Completed", stats.completed_jobs]].map(([label, value]) => <div key={label} className="field-card field-stat"><div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, fontFamily: "Sora, sans-serif" }}>{value ?? 0}</div></div>)}
      </section>

      <section className="field-card">
        <h2 style={{ marginTop: 0 }}>Work Orders — {data?.team?.name || teamCode || ""}</h2>
        <p style={{ color: "var(--muted)" }}>Status changes only happen when a field-team action is submitted. Selecting a team or refreshing does not update a job's status.</p>
        {loading && <p style={{ color: "var(--muted)" }}>Loading work orders…</p>}
        {!loading && !error && jobs.length === 0 && <div style={{ textAlign: "center", padding: "36px 12px", color: "var(--muted)" }}><div style={{ fontSize: 34 }}>📋</div><h3 style={{ color: "var(--ink)" }}>No jobs assigned to this team</h3><p>Assign an incident to this team in the Department Dashboard, then refresh.</p></div>}
        <div style={{ display: "grid", gap: 16 }}>
          {jobs.map((job) => {
            const status = display(job.work_status || job.status, ["status", "label", "name", "value"]);
            const normalized = status.toLowerCase();
            const rawProgress = Number(job.progress ?? 0);
            const progress = Math.max(0, Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 0));
            const busy = busyId === job.incident_id;
            const completed = normalized === "completed" || normalized === "work completed";
            return <article key={job.incident_id} className="field-job">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><small style={{ color: "var(--muted)" }}>{display(job.incident_id)}</small><h3 style={{ margin: "7px 0" }}>{display(job.title || job.issue_type || job.category, ["title", "name", "label", "value"])}</h3></div><strong className={`field-pill ${completed ? "done" : normalized === "in progress" ? "active" : "todo"}`}>{status}</strong></div>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.5 }}>{display(job.description || job.details, ["description", "details", "text", "value"])}</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14, color: "var(--ink-soft)" }}><span>📍 {display(job.location || job.address, ["address", "name", "label", "value"])}</span><span>⚠️ {display(job.severity, ["level", "severity", "label", "name", "value"])}</span><span>🏷️ {display(job.category || job.department, ["name", "label", "category", "value"])}</span></div>
              {job.field_team_name && <p style={{ fontSize: 13, color: "var(--muted)" }}>Assigned to: {job.field_team_name} ({job.field_team_code})</p>}
              <div style={{ marginTop: 20 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}><strong>Work Progress</strong><strong>{progress}%</strong></div><div className="field-bar"><div style={{ width: `${progress}%` }} /></div></div>
              <label style={{ display: "block", marginTop: 18, fontSize: 13, fontWeight: 600 }}>Work update / field note<textarea value={notes[job.incident_id] || ""} onChange={(event) => setNotes((prev) => ({ ...prev, [job.incident_id]: event.target.value }))} placeholder="Describe the work completed or remaining…" rows={2} className="field-textarea" /></label>
              {!completed && <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {normalized === "assigned" && <button className="field-btn" disabled={busy} onClick={() => updateJob(job, "Accepted", 0)}>{busy ? "Saving…" : "Accept Job"}</button>}
                {normalized === "accepted" && <button className="field-btn" disabled={busy} onClick={() => updateJob(job, "In Progress", 10)}>{busy ? "Saving…" : "Start Work"}</button>}
                {normalized === "in progress" && <><button className="field-btn" disabled={busy} onClick={() => updateJob(job, "In Progress", Math.min(progress + 25, 99))}>{busy ? "Saving…" : "Update Progress"}</button><button className="field-btn success" disabled={busy} onClick={() => { if (window.confirm("Confirm that this work has actually been completed?")) updateJob(job, "Completed", 100); }}>{busy ? "Saving…" : "Complete Work"}</button></>}
              </div>}
              {completed && <p style={{ color: "#0a9f70", fontWeight: 700 }}>✓ Backend reports this job as completed.</p>}
            </article>;
          })}
        </div>
      </section>
    </div></RoleLayout>
  );
}
