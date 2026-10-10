import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";

function RoleLayout({ role, children }) {
  return (
    <div className="app-shell">

      <Sidebar role={role} />

      <div className="main-area">

        <Topbar role={role} />

        <main className="main-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default RoleLayout;