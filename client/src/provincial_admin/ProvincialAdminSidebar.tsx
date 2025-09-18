import React from "react";
import { Link } from "react-router-dom";

interface ProvincialAdminSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleLogout: () => void;
  adminProvince: string;
}

const ProvincialAdminSidebar: React.FC<ProvincialAdminSidebarProps> = ({
  open,
  setOpen,
  activeSection,
  setActiveSection,
  handleLogout,
  adminProvince
}) => {
  const handleNav = (section: string) => {
    setActiveSection(section);
    setOpen(false);
  };

  const navItems = [
    { id: "dashboard", label: "Main Dashboard", icon: "bi-house", ariaLabel: "Main Dashboard" },
    { id: "municipality-list", label: "Municipality List", icon: "bi-building", ariaLabel: "Municipality List" }
  ];

  const renderNavLink = (item: any, isMobile: boolean = false) => (
    <li className="nav-item" key={item.id}>
      <button
        className={`nav-link d-flex align-items-center ${activeSection === item.id ? "active" : ""}`}
        style={{
          padding: "12px 20px",
          transition: "all 0.3s ease",
          backgroundColor: activeSection === item.id ? "#00BCD4" : "transparent",
          color: activeSection === item.id ? "#FFFFFF" : "#37474F",
          borderRadius: 8,
          margin: "4px 0",
          display: "block",
          border: "none",
          width: "100%",
          textAlign: "left",
          fontWeight: activeSection === item.id ? 700 : 500,
          cursor: "pointer"
        }}
        onClick={() => isMobile ? handleNav(item.id) : setActiveSection(item.id)}
        aria-label={item.ariaLabel}
      >
        <i className={`bi ${item.icon}`} style={{ marginRight: 12 }} />
        {item.label}
      </button>
    </li>
  );

  return (
    <>
      {/* Overlay for mobile/tablet drawer */}
      {open && (
        <div 
          className="d-md-none" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(0,0,0,0.2)', 
            zIndex: 1050 
          }} 
          onClick={() => setOpen(false)}
        />
      )}
      {/* Off-canvas sidebar for mobile/tablet */}
      <div
        className={`d-md-none sidebar d-flex flex-column${open ? ' open' : ''}`}
        style={{
          backgroundColor: "#E0F7FA",
          minHeight: "50vh",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          padding: "20px 0",
          position: 'fixed',
          left: open ? 0 : '-80vw',
          top: 0,
          width: '70vw',
          maxWidth: 300,
          height: '100vh',
          zIndex: 1052,
          transition: 'left 0.3s',
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map(item => renderNavLink(item, true))}
        </ul>
        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            background: "#FF5252",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
      {/* Desktop sidebar (always visible) */}
      <div
        className="d-none d-md-flex flex-column sidebar"
        style={{
          backgroundColor: "#E0F7FA",
          minHeight: "100vh",
          width: 260,
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          padding: "30px 0",
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1051,
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: 20, color: "#0288D1", marginBottom: 30, textAlign: "center" }}>
          {adminProvince} Provincial Admin
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {navItems.map(item => renderNavLink(item))}
        </ul>
        <button
          onClick={handleLogout}
          style={{
            marginTop: "auto",
            background: "#FF5252",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </>
  );
};

export default ProvincialAdminSidebar;
