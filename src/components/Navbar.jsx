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
    { path: "/", label: "Inicio", icon: "🏠" },
    { path: "/agenda", label: "Agenda", icon: "📅" },
    { path: "/pacientes", label: "Pacientes", icon: "👥" },
    { path: "/reportes", label: "Reportes", icon: "📊" },
  ];

  return (
    <>
      {/* Navbar superior — solo logo y salir */}
      <nav style={styles.nav}>
        <span style={styles.logo}>Kinesis</span>
        <button onClick={handleLogout} style={styles.logout}>Salir</button>
      </nav>

      {/* Barra inferior — navegación en móvil */}
      <div style={styles.bottomBar}>
        {links.map(link => {
          const active = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                ...styles.bottomBtn,
                color: active ? "#185FA5" : "#94a3b8",
              }}
            >
              <span style={styles.bottomIcon}>{link.icon}</span>
              <span style={{ ...styles.bottomLabel, fontWeight: active ? "600" : "400" }}>
                {link.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Espaciado para que el contenido no quede detrás de la barra inferior */}
      <div style={{ height: "64px" }} />
    </>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.25rem",
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
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "white",
    borderTop: "0.5px solid #e2e8f0",
    display: "flex",
    zIndex: 100,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  bottomBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    padding: "10px 4px",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  bottomIcon: {
    fontSize: "1.2rem",
  },
  bottomLabel: {
    fontSize: "0.7rem",
    color: "inherit",
  },
};