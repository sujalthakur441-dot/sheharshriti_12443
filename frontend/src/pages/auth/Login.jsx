import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Users, Building2, Wrench, Landmark } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const handleDemoLogin = (role) => {
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">
          <div className="brand-mark">S</div>

          <div>
            <h2>SheharShriti</h2>
            <span>Civic Intelligence Platform</span>
          </div>
        </div>

        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p>
            Choose a workspace to continue.
          </p>
        </div>


        <div className="demo-login-section">

          <p className="demo-label">
            Choose a demo workspace
          </p>

          <div className="role-picker">
            <button className="role-option" onClick={() => handleDemoLogin("citizen")}>
              <span className="role-icon"><Users size={20} /></span>
              <strong>Citizen Portal</strong>
              <small>Report issues and track progress</small>
            </button>

            <button className="role-option" onClick={() => handleDemoLogin("department")}>
              <span className="role-icon"><Building2 size={20} /></span>
              <strong>Department Portal</strong>
              <small>Route incidents and assign teams</small>
            </button>

            <button className="role-option" onClick={() => handleDemoLogin("field-team")}>
              <span className="role-icon"><Wrench size={20} /></span>
              <strong>Field Team</strong>
              <small>Accept jobs and update work</small>
            </button>

            <button className="role-option" onClick={() => handleDemoLogin("oversight")}>
              <span className="role-icon"><Landmark size={20} /></span>
              <strong>Oversight Console</strong>
              <small>Monitor the whole city</small>
            </button>
          </div>

        </div>


        <div className="auth-note">
          <ShieldCheck size={18} />

          <span>
            Authentication and role-based access will be connected
            to the FastAPI backend in the next development stage.
          </span>
        </div>


        <Link to="/" className="back-home">
          ← Back to SheharShriti
        </Link>

      </div>

    </div>
  );
}

export default Login;