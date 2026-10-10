import {
  Bell,
  Search
} from "lucide-react";

function Topbar({ role }) {

  const roleNames = {
    citizen: "Citizen Portal",
    department: "Department Portal",
    "field-team": "Field Team",
    oversight: "Central Oversight"
  };

  return (
    <header className="topbar">

      <div className="topbar-left">

        <div className="mobile-brand">
          <strong>SheharShriti</strong>
        </div>

        <div className="page-context">
          {roleNames[role] || "SheharShriti"}
        </div>

      </div>


      <div className="topbar-right">

        <div className="global-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search..."
          />
        </div>


        <button className="notification-button">
          <Bell size={19} />

          <span className="notification-dot"></span>
        </button>


        <div className="user-profile">

          <div className="user-avatar">
            {role === "citizen"
              ? "C"
              : role === "department"
              ? "D"
              : role === "field-team"
              ? "F"
              : "O"}
          </div>

          <div className="user-info">
            <strong>
              {role === "citizen"
                ? "Citizen User"
                : role === "department"
                ? "Department Officer"
                : role === "field-team"
                ? "Field Team"
                : "Oversight Officer"}
            </strong>

            <span>
              {roleNames[role]}
            </span>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;