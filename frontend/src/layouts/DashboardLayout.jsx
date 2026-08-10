import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/dashboard.css";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "bi-grid-1x2", label: "Dashboard", end: true },
  { to: "/dashboard/sales-analytics", icon: "bi-graph-up", label: "Sales Analytics" },
  { to: "/dashboard/product-performance", icon: "bi-box-seam", label: "Product Performance" },
  { to: "/dashboard/customer-analytics", icon: "bi-people", label: "Customer Analytics" },
  { to: "/dashboard/sales-trends", icon: "bi-bar-chart-line", label: "Sales Trends" },
  { to: "/dashboard/forecasting", icon: "bi-cloud-sun", label: "Forecasting" },
  { to: "/dashboard/reports", icon: "bi-file-earmark-text", label: "Reports" },
  { to: "/dashboard/import-data", icon: "bi-cloud-upload", label: "Import Data" },
  { to: "/dashboard/manual-entry", icon: "bi-pencil-square", label: "Manual Entry" },
  { to: "/dashboard/ai-assistant", icon: "bi-stars", label: "AI Assistant" },
  { to: "/dashboard/notifications", icon: "bi-bell", label: "Notifications" },
  { to: "/dashboard/settings", icon: "bi-gear", label: "Settings" },
  { to: "/dashboard/profile", icon: "bi-person-circle", label: "Profile" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="ri-shell">
      <aside className="ri-sidebar">
        <div className="ri-sidebar-logo">
          <img src={logo} alt="RetailInsight" />
          <span>RetailInsight</span>
        </div>

        <nav className="ri-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `ri-sidebar-link${isActive ? " active" : ""}`}
            >
              <i className={`bi ${item.icon}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ri-sidebar-footer">
          <button
            onClick={onLogout}
            className="ri-sidebar-link"
            style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer" }}
          >
            <i className="bi bi-box-arrow-right" />
            Logout
          </button>
        </div>
      </aside>

      <div className="ri-main">
        <header className="ri-topbar">
          <div className="ri-topbar-search">
            <i className="bi bi-search" />
            <input placeholder="Search here..." />
          </div>

          <div className="ri-topbar-actions">
            <button className="ri-topbar-icon-btn">
              <i className="bi bi-bell" />
            </button>
            <div className="ri-topbar-user">
              <div className="ri-topbar-avatar">{initials}</div>
              <div className="ri-topbar-user-meta">
                <strong>{user?.full_name}</strong>
                <span>{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="ri-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
