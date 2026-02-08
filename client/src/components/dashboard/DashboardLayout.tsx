import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook";

const NAV_ITEMS = [
  {
    section: "Proizvodnja i prodaja",
    roles: ["SALES_MANAGER", "SALESPERSON"],
    items: [
      { path: "/dashboard/production", label: "Proizvodnja", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
      { path: "/dashboard/processing", label: "Prerada", icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" },
      { path: "/dashboard/storage", label: "Skladistenje", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
      { path: "/dashboard/sales", label: "Prodaja", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
    ],
  },
  {
    section: "Analitika",
    roles: ["ADMIN"],
    items: [
      { path: "/dashboard/analytics", label: "Analiza prodaje", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { path: "/dashboard/performance", label: "Performanse", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
      { path: "/dashboard/audit", label: "Evidencija", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    ],
  },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userRole = user?.role || "";

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Parfimerija O'Sinjel De Or</h2>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => {
            const hasAccess = section.roles.includes(userRole);
            if (!hasAccess) return null;

            return (
              <React.Fragment key={section.section}>
                <div className="sidebar-section">{section.section}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </NavLink>
                ))}
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.username}</div>
              <div className="sidebar-user-role">{userRole}</div>
            </div>
          </div>
          <button
            className="btn-ghost w-full"
            style={{ marginTop: 8, justifyContent: "flex-start", fontSize: 13, padding: "8px 12px" }}
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Odjavi se
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};
