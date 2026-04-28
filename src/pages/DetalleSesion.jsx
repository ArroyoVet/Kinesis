import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext"; // Importar arriba

export default function DetalleSesion() {
  const { id, epId, sesId } = useParams();
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    async function cargar() {
      const snap = await getDoc(doc(db, "patients", id, "episodes", epId, "sessions", sesId));
      if (snap.exists()) setSesion({ id: snap.id, ...snap.data() });
      setLoading(false);
    }
    cargar();
  }, []);

  async function handleEliminar() {
    if (!confirm("¿Eliminar esta sesión?")) return;
    await deleteDoc(doc(db, "patients", id, "episodes", epId, "sessions", sesId));
    navigate(`/pacientes/${id}/episodios/${epId}`);
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>;
  if (!sesion) return <div style={styles.loading}>Sesión no encontrada</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <button style={styles.btnVolver} onClick={() => navigate(`/pacientes/${id}/episodios/${epId}`)}>← Volver</button>

        <div style={styles.header}>
          <div>
            <h2 style={styles.titulo}>Sesión #{sesion.numeroCita}</h2>
            <p style={styles.subinfo}>{sesion.fecha} · {sesion.hora} · {sesion.tiempoSesion} min</p>
          </div>
          <div style={styles.headerBtns}>
            <button style={styles.btnEditar} onClick={() => navigate(`/pacientes/${id}/episodios/${epId}/sesiones/${sesId}/editar`)}>✏️ Editar</button>
                {role !== "admin" && (
                <button style={styles.btnEliminar} onClick={handleEliminar}>🗑️ Eliminar</button>
            )}
            </div>
        </div>

        {!sesion.asistio ? (
          <div style={styles.noAsistio}>
            <p>⚠️ Paciente no asistió</p>
            {sesion.motivoFalta && <p style={styles.motivo}>Motivo: {sesion.motivoFalta}</p>}
          </div>
        ) : (
          <>
            {/* Dolor */}
            <div style={styles.card}>
              <h4 style={styles.cardTitulo}>Escala de dolor (EVA)</h4>
              <div style={styles.dolorFila}>
                <div style={styles.dolorBox}>
                  <span style={styles.dolorNum}>{sesion.dolorInicio}</span>
                  <span style={styles.dolorLabel}>Al inicio</span>
                </div>
                <span style={styles.flecha}>→</span>
                <div style={styles.dolorBox}>
                  <span style={{ ...styles.dolorNum, color: sesion.dolorFin < sesion.dolorInicio ? "#22c55e" : "#ef4444" }}>
                    {sesion.dolorFin}
                  </span>
                  <span style={styles.dolorLabel}>Al final</span>
                </div>
                <div style={styles.dolorBox}>
                  <span style={styles.dolorNum}>{sesion.mejoraRespecto}</span>
                  <span style={styles.dolorLabel}>Mejora</span>
                </div>
              </div>
            </div>

            {/* Técnicas */}
            {sesion.tecnicasAplicadas?.length > 0 && (
              <div style={styles.card}>
                <h4 style={styles.cardTitulo}>Técnicas aplicadas</h4>
                <div style={styles.chips}>
                  {sesion.tecnicasAplicadas.map(t => (
                    <span key={t} style={styles.chip}>{t}</span>
                  ))}
                </div>
                {sesion.zonasTratadas && <p style={styles.zona}>Zona: {sesion.zonasTratadas}</p>}
              </div>
            )}

            {/* Tareas */}
            <div style={styles.card}>
              <h4 style={styles.cardTitulo}>Tareas en casa</h4>
              <p style={styles.texto}>Cumplidas: <strong>{sesion.tareasCumplidas}</strong></p>
              {sesion.ejerciciosIndicados && (
                <>
                  <p style={styles.subLabel}>Ejercicios en sesión:</p>
                  <p style={styles.texto}>{sesion.ejerciciosIndicados}</p>
                </>
              )}
              {sesion.ejerciciosEnCasa && (
                <>
                  <p style={styles.subLabel}>Ejercicios en casa:</p>
                  <p style={styles.texto}>{sesion.ejerciciosEnCasa}</p>
                </>
              )}
            </div>
          </>
        )}

        {/* Observaciones */}
        {sesion.observaciones && (
          <div style={styles.card}>
            <h4 style={styles.cardTitulo}>Observaciones</h4>
            <p style={styles.texto}>{sesion.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: "2rem", textAlign: "center", color: "#64748b" },
  container: { padding: "0.75rem 1rem", maxWidth: "700px", margin: "0 auto" },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem", fontWeight: "500", marginBottom: "1rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: "1rem" },
  titulo: { margin: 0, fontSize: "1.4rem", color: "#1e293b" },
  subinfo: { margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.9rem" },
  headerBtns: { display: "flex", gap: "0.5rem" },
  btnEditar: { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: "500" },
  btnEliminar: { padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", cursor: "pointer", fontWeight: "500" },
  noAsistio: { background: "#fff5f5", borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem", color: "#ef4444", fontWeight: "600" },
  motivo: { color: "#64748b", fontWeight: "400", marginTop: "0.5rem" },
  card: { background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "1rem" },
  cardTitulo: { margin: "0 0 1rem", color: "#1e293b", fontSize: "1rem" },
  dolorFila: { display: "flex", alignItems: "center", gap: "1rem" },
  dolorBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" },
  dolorNum: { fontSize: "2rem", fontWeight: "700", color: "#2563eb" },
  dolorLabel: { fontSize: "0.78rem", color: "#64748b" },
  flecha: { fontSize: "1.5rem", color: "#94a3b8" },
  chips: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  chip: { padding: "0.3rem 0.75rem", borderRadius: "0.4rem", background: "#f1f5f9", fontSize: "0.85rem", color: "#374151", fontWeight: "500" },
  zona: { marginTop: "0.75rem", color: "#64748b", fontSize: "0.9rem" },
  subLabel: { fontWeight: "600", color: "#374151", fontSize: "0.85rem", margin: "0.75rem 0 0.25rem" },
  texto: { color: "#374151", fontSize: "0.95rem", margin: 0 },
};