import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  const links = [
    { path: "/", label: "🏠 Inicio" },
    { path: "/agenda", label: "📅 Agenda" },
    { path: "/pacientes", label: "👥 Pacientes" },
    { path: "/reportes", label: "📊 Reportes" },
  ];

  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>PhysioTrack</span>
      <div style={styles.links}>
        {links.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              ...styles.btn,
              background: location.pathname === link.path ? "#2563eb" : "transparent",
              color: location.pathname === link.path ? "white" : "#374151",
            }}
          >
            {link.label}
          </button>
        ))}
      </div>
      <button onClick={handleLogout} style={styles.logout}>Salir</button>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.5rem",
    background: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: "700",
    fontSize: "1.25rem",
    color: "#2563eb",
  },
  links: {
    display: "flex",
    gap: "0.5rem",
  },
  btn: {
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  logout: {
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    color: "#ef4444",
    fontWeight: "500",
  },
};