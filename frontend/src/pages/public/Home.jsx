import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Brain,
  Building2,
  ArrowRight,
  Users,
  Wrench,
  Landmark,
  Sparkles
} from "lucide-react";

function Home() {
  return (
    <div className="home-page">

      <header className="main-header">
        <div className="brand">
          <div className="brand-mark">
            S
          </div>

          <div>
            <h2>SheharShriti</h2>
            <span>Civic Intelligence Platform</span>
          </div>
        </div>

        <nav>
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>

          <Link to="/login" className="login-button">
            Login
          </Link>
        </nav>
      </header>


      <main>

        <section className="hero">

          <div className="hero-content">

            <span className="hero-badge">
              <Sparkles size={14} /> AI-POWERED CIVIC INTELLIGENCE
            </span>

            <h1>
              Making Civic Issues
              <span> Visible.</span>
              <br />
              Making Action
              <span> Trackable.</span>
            </h1>

            <p>
              SheharShriti connects citizens, public infrastructure,
              government departments, field teams and oversight authorities
              through one intelligent civic platform.
            </p>

            <div className="hero-actions">

              <Link
                to="/login"
                className="primary-button"
              >
                Explore Platform
                <ArrowRight size={18} />
              </Link>

              <a
                href="#how-it-works"
                className="secondary-button"
              >
                How It Works
              </a>

            </div>

            <div className="hero-trust">
              <span>✓ Transparent</span>
              <span>✓ Evidence-backed</span>
              <span>✓ Citizen-verified</span>
            </div>

          </div>


          <div className="hero-visual">

            <div className="map-card">

              <div className="map-header">
                <span>LIVE CIVIC MAP</span>
                <span className="live-status">
                  ● LIVE
                </span>
              </div>

              <div className="fake-map">

                <div className="map-road road-one"></div>
                <div className="map-road road-two"></div>

                <div className="map-marker marker-one">
                  <MapPin size={18} />
                </div>

                <div className="map-marker marker-two">
                  <MapPin size={18} />
                </div>

                <div className="map-marker marker-three">
                  <MapPin size={18} />
                </div>

                <div className="map-info">
                  <strong>SHR-2026-001042</strong>
                  <span>Road maintenance incident</span>
                </div>

              </div>

            </div>

          </div>

        </section>


        <section className="impact-strip" aria-label="Platform impact">
          <div className="impact-card"><strong>4</strong><span>Connected roles, one workflow</span></div>
          <div className="impact-card"><strong>8</strong><span>Step lifecycle, report to oversight</span></div>
          <div className="impact-card"><strong>AI</strong><span>Auto-routing to the right department</span></div>
          <div className="impact-card"><strong>100%</strong><span>Actions backed by evidence</span></div>
        </section>


        <section
          id="features"
          className="features-section"
        >

          <div className="section-heading">
            <span>THE PLATFORM</span>

            <h2>
              From Citizen Report
              <br />
              to Verified Resolution
            </h2>

            <p>
              Today a pothole report disappears into a void. SheharShriti
              makes every complaint traceable, accountable and verifiable.
            </p>
          </div>


          <div className="feature-grid">

            <FeatureCard
              icon={<Brain />}
              title="AI Incident Intelligence"
              text="Understand reports, connect related complaints and identify civic incidents."
            />

            <FeatureCard
              icon={<MapPin />}
              title="Public Infrastructure"
              text="Track roads, buses, EV chargers, streetlights and other civic assets."
            />

            <FeatureCard
              icon={<ShieldCheck />}
              title="Evidence & Verification"
              text="Connect work records, evidence, inspection and citizen verification."
            />

            <FeatureCard
              icon={<Building2 />}
              title="Government Workflow"
              text="Connect departments, field teams and authorized oversight authorities."
            />

          </div>

        </section>


        <section
          id="how-it-works"
          className="workflow-section"
        >

          <div className="section-heading">
            <span>CORE LIFECYCLE</span>

            <h2>
              Discover → Report → Connect → Act → Verify
            </h2>
          </div>

          <div className="workflow">

            {[
              "Discover",
              "Report",
              "Connect",
              "Route",
              "Act",
              "Record",
              "Verify",
              "Oversee"
            ].map((step, index) => (
              <div className="workflow-step" key={step}>

                <div className="step-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <span>{step}</span>

              </div>
            ))}

          </div>

        </section>


        <section className="roles-section">

          <div className="section-heading">
            <span>BUILT FOR EVERYONE</span>
            <h2>One platform, four workspaces</h2>
          </div>

          <div className="role-grid">
            {[
              [<Users />, "Citizens", "Report issues with photos and location, then track progress and verify the fix."],
              [<Building2 />, "Departments", "Receive AI-routed incidents, assign teams and manage work orders."],
              [<Wrench />, "Field Teams", "Accept jobs, post live progress updates and upload proof of work."],
              [<Landmark />, "Oversight", "Monitor workloads, disputes and incidents that need attention."]
            ].map(([icon, title, text]) => (
              <div className="role-card" key={title}>
                <div className="role-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>

        </section>


        <section className="tech-section">

          <div className="section-heading">
            <span>UNDER THE HOOD</span>
            <h2>Modern, scalable stack</h2>
          </div>

          <div className="tech-chips">
            {["React 19", "Vite", "React Router", "FastAPI", "AI Incident Matching", "REST APIs", "Role-based Access"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>

        </section>


        <section className="cta-band">
          <h2>See civic accountability in action</h2>
          <p>Jump into any workspace and follow an incident from report to verified resolution.</p>
          <Link to="/login" className="primary-button">
            Launch Demo <ArrowRight size={18} />
          </Link>
        </section>

      </main>


      <footer>
        <div>
          <strong>SheharShriti</strong>
          <span>
            AI-Powered Civic Intelligence & Public Infrastructure Accountability
          </span>
        </div>

        <span>© 2026 SheharShriti</span>
      </footer>

    </div>
  );
}


function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );
}

export default Home;