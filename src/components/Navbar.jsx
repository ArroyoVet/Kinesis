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
      <span style={styles.logo}>Kinesis</span>
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
    gap: "1.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    borderBottom: "0.5px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: "500",
    fontSize: "1.2rem",
    color: "#185FA5",
    letterSpacing: "-0.5px",
    marginRight: "0.5rem",
  },
  links: {
    display: "flex",
    gap: "4px",
    flex: 1,
  },
  btn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "400",
  },
  logout: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "0.5px solid #F7C1C1",
    background: "white",
    cursor: "pointer",
    color: "#A32D2D",
    fontSize: "0.875rem",
  },
};