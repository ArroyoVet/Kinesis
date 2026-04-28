import { useState, useEffect } from "react";

export default function BotonInstalar() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [esMovil, setEsMovil] = useState(false);

  useEffect(() => {
    // Detectar si es dispositivo móvil
    const checkMovil = () => setEsMovil(window.innerWidth <= 768);
    checkMovil();
    window.addEventListener("resize", checkMovil);

    const interceptarInstalacion = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", interceptarInstalacion);

    return () => {
      window.removeEventListener("beforeinstallprompt", interceptarInstalacion);
      window.removeEventListener("resize", checkMovil);
    };
  }, []);

  const handleInstalarClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  if (!esMovil || !deferredPrompt) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.info}>
        <span style={styles.icono}>📲</span>
        <div>
          <p style={styles.titulo}>Kinesis en tu celular</p>
          <p style={styles.subtitulo}>Instala la app para mayor comodidad</p>
        </div>
      </div>
      <button onClick={handleInstalarClick} style={styles.boton}>
        Instalar
      </button>
    </div>
  );
}

const styles = {
  banner: {
    background: "linear-gradient(90deg, #185FA5 0%, #2563eb 100%)",
    color: "white",
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(24, 95, 165, 0.25)",
  },
  info: { display: "flex", alignItems: "center", gap: "0.75rem" },
  icono: { fontSize: "1.4rem" },
  titulo: { margin: 0, fontWeight: "700", fontSize: "0.95rem" },
  subtitulo: { margin: 0, fontSize: "0.75rem", opacity: 0.9 },
  boton: {
    background: "white",
    color: "#185FA5",
    border: "none",
    padding: "0.5rem 0.9rem",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "0.8rem",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  }
};