import {
  LayoutDashboard,
  Map,
  FileText,
  AlertTriangle,
  Building2,
  ClipboardList,
  Camera,
  ShieldCheck,
  Bot,
  Settings,
  LogOut,
  Users,
  Wrench
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

function Sidebar({ role }) {
  const navigate = useNavigate();

  const menus = {
    citizen: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/citizen/dashboard"
      },
      {
        label: "Live Civic Map",
        icon: Map,
        path: "/citizen/map"
      },
      {
        label: "Report Issue",
        icon: FileText,
        path: "/citizen/report"
      },
      {
        label: "My Reports",
        icon: AlertTriangle,
        path: "/citizen/reports"
      },
      {
        label: "My Verifications",
        icon: ShieldCheck,
        path: "/citizen/verifications"
      }
    ],

    department: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/department/dashboard"
      },
      {
        label: "Live Civic Map",
        icon: Map,
        path: "/department/map"
      },
      {
        label: "Incidents",
        icon: AlertTriangle,
        path: "/department/incidents"
      },
      {
        label: "Assets",
        icon: Building2,
        path: "/department/assets"
      },
      {
        label: "Work Orders",
        icon: ClipboardList,
        path: "/department/work-orders"
      },
      {
        label: "Field Teams",
        icon: Users,
        path: "/department/field-teams"
      },
      {
        label: "Evidence",
        icon: Camera,
        path: "/department/evidence"
      }
    ],

    "field-team": [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/field-team/dashboard"
      },
      {
        label: "Assigned Jobs",
        icon: ClipboardList,
        path: "/field-team/jobs"
      },
      {
        label: "Live Map",
        icon: Map,
        path: "/field-team/map"
      },
      {
        label: "Work Updates",
        icon: Wrench,
        path: "/field-team/work"
      },
      {
        label: "Evidence",
        icon: Camera,
        path: "/field-team/evidence"
      }
    ],

    oversight: [
      {
        label: "Command Center",
        icon: LayoutDashboard,
        path: "/oversight/dashboard"
      },
      {
        label: "City Map",
        icon: Map,
        path: "/oversight/map"
      },
      {
        label: "All Incidents",
        icon: AlertTriangle,
        path: "/oversight/incidents"
      },
      {
        label: "Infrastructure",
        icon: Building2,
        path: "/oversight/assets"
      },
      {
        label: "Work Monitoring",
        icon: ClipboardList,
        path: "/oversight/work"
      },
      {
        label: "Evidence Review",
        icon: Camera,
        path: "/oversight/evidence"
      },
      {
        label: "Attention Required",
        icon: ShieldCheck,
        path: "/oversight/reviews"
      }
    ]
  };

  const currentMenus = menus[role] || [];

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          S
        </div>

        <div>
          <strong>SheharShriti</strong>
          <span>Civic Intelligence</span>
        </div>

      </div>


      <nav className="sidebar-navigation">

        <div className="navigation-label">
          WORKSPACE
        </div>

        {currentMenus.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );

        })}


        <div className="navigation-divider" />

        <div className="navigation-label">
          SYSTEM
        </div>

        <NavLink
          to={`/${role}/assistant`}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Bot size={18} />
          <span>AI Assistant</span>
        </NavLink>

        <NavLink
          to={`/${role}/settings`}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

      </nav>


      <div className="sidebar-footer">

        <button
          className="logout-button"
          onClick={() => navigate("/")}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;