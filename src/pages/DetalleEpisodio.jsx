import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, collection, getDocs, orderBy, query, deleteDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

export default function DetalleEpisodio() {
  const { id, epId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [episodio, setEpisodio] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const pacSnap = await getDoc(doc(db, "patients", id));
      if (pacSnap.exists()) setPaciente({ id: pacSnap.id, ...pacSnap.data() });

      const epSnap = await getDoc(doc(db, "patients", id, "episodes", epId));
      if (epSnap.exists()) setEpisodio({ id: epSnap.id, ...epSnap.data() });

      const sesSnap = await getDocs(
        query(collection(db, "patients", id, "episodes", epId, "sessions"), orderBy("fecha", "desc"))
      );
      setSesiones(sesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    cargar();
  }, [id, epId]);

  async function handleEliminarEpisodio() {
    if (window.confirm("¿Estás seguro de eliminar este episodio de tratamiento?")) {
      try {
        await deleteDoc(doc(db, "patients", id, "episodes", epId));
        navigate(`/pacientes/${id}`); // Lo regresamos al perfil del paciente
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>;
  if (!episodio) return <div style={styles.loading}>Episodio no encontrado</div>;

  const promedioMejora = sesiones.length > 0
    ? (sesiones.filter(s => s.mejoraRespecto === "Sí").length / sesiones.length * 100).toFixed(0)
    : null;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <button style={styles.btnVolver} onClick={() => navigate(`/pacientes/${id}`)}>← Volver</button>

        {/* Header episodio */}
        <div style={styles.header}>
          <div style={{ ...styles.colorDot, background: episodio.color || "#2563eb" }} />
          <div>
            <h2 style={styles.titulo}>{episodio.motivoConsulta}</h2>
            <p style={styles.subinfo}>
              {paciente?.nombre} · Inicio: {episodio.fechaInicio} · {episodio.seguro}
            </p>
          </div>
          
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ ...styles.badge, background: badgeColor(episodio.estado) }}>
              {episodio.estado}
            </span>
            
            {/* Botón de eliminar episodio */}
            {role !== "admin" && (
               <button 
                 style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem" }} 
                 onClick={handleEliminarEpisodio}
                 title="Eliminar episodio"
               >
                 🗑️
               </button>
            )}
          </div>
        </div>

        {/* Stats automáticos */}
        <div style={styles.statsGrid}>
                    <div style={styles.chartContainer}>
            <h3 style={styles.seccionTitulo}>Evolución del Dolor (EVA)</h3>
            <div style={{ height: 250, marginTop: "1rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...sesiones].reverse()}> {/* Invertimos para que el tiempo vaya de izquierda a derecha */}
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="numeroCita" label={{ value: 'Sesión', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                    type="monotone" 
                    dataKey="dolorInicio" 
                    stroke="#ef4444" 
                    name="Dolor Inicio" 
                    strokeWidth={2}
                    dot={{ r: 4 }} 
                    />
                    <Line 
                    type="monotone" 
                    dataKey="dolorFin" 
                    stroke="#22c55e" 
                    name="Dolor Fin" 
                    strokeWidth={2}
                    dot={{ r: 4 }} 
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{sesiones.length}</span>
            <span style={styles.statLabel}>Sesiones totales</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{sesiones.filter(s => s.asistio).length}</span>
            <span style={styles.statLabel}>Asistidas</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{sesiones.filter(s => !s.asistio).length}</span>
            <span style={styles.statLabel}>Faltas</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{promedioMejora !== null ? promedioMejora + "%" : "—"}</span>
            <span style={styles.statLabel}>Sesiones con mejora</span>
          </div>
        </div>

        {/* Sesiones */}
            <div style={styles.seccion}>
          <div style={styles.seccionHeader}>
            <h3 style={styles.seccionTitulo}>Sesiones</h3>
            
            {/* Solo se muestra si el usuario NO es un administrador */}
            {role !== "admin" && (
              <button
                style={styles.btnNuevo}
                onClick={() => navigate(`/pacientes/${id}/episodios/${epId}/nueva-sesion`)}
              >
                + Nueva sesión
              </button>
            )}
          </div>

          {sesiones.length === 0 && <p style={styles.vacio}>No hay sesiones registradas</p>}

          {sesiones.map((s, i) => (
            <div
              key={s.id}
              style={styles.sesionCard}
              onClick={() => navigate(`/pacientes/${id}/episodios/${epId}/sesiones/${s.id}`)}
            >
              <div style={styles.sesionLeft}>
                <span style={styles.sesionNum}>#{sesiones.length - i}</span>
                <div>
                  <p style={styles.sesionFecha}>{s.fecha} · {s.hora}</p>
                  <p style={styles.sesionDetalle}>
                    {s.asistio ? `Dolor: ${s.dolorInicio}→${s.dolorFin} · ${s.mejoraRespecto}` : "⚠️ No asistió"}
                  </p>
                </div>
              </div>
              <div style={styles.sesionRight}>
                {s.tecnicasAplicadas?.slice(0, 2).map(t => (
                  <span key={t} style={styles.tecnicaChip}>{t}</span>
                ))}
                <span style={styles.flecha}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function badgeColor(estado) {
  if (estado === "alta") return "#22c55e";
  if (estado === "abandono") return "#ef4444";
  return "#2563eb";
}

const styles = {
  loading: { padding: "2rem", textAlign: "center", color: "#64748b" },
  container: { padding: "0.75rem 1rem", maxWidth: "800px", margin: "0 auto" },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem", fontWeight: "500", marginBottom: "1rem" },
  header: { display: "flex", alignItems: "center", gap: "1rem", background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: "1rem" },
  colorDot: { width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0 },
  titulo: { margin: 0, fontSize: "1.4rem", color: "#1e293b" },
  subinfo: { margin: 0, color: "#64748b", fontSize: "0.85rem" },
  badge: { marginLeft: "auto", padding: "0.25rem 0.75rem", borderRadius: "999px", color: "white", fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" },
  statCard: { background: "white", borderRadius: "0.75rem", padding: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.25rem" },
  statNum: { fontSize: "1.75rem", fontWeight: "700", color: "#2563eb" },
  statLabel: { fontSize: "0.78rem", color: "#64748b" },
  seccion: { background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  seccionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  seccionTitulo: { margin: 0, color: "#1e293b" },
  btnNuevo: { padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", cursor: "pointer", fontWeight: "600" },
  vacio: { color: "#94a3b8", textAlign: "center", padding: "1rem" },
  sesionCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #f1f5f9", cursor: "pointer", marginBottom: "0.5rem" },
  sesionLeft: { display: "flex", alignItems: "center", gap: "1rem" },
  sesionNum: { fontSize: "1.1rem", fontWeight: "700", color: "#2563eb", minWidth: "30px" },
  sesionFecha: { margin: 0, fontWeight: "600", color: "#1e293b", fontSize: "0.9rem" },
  sesionDetalle: { margin: 0, fontSize: "0.82rem", color: "#64748b" },
  sesionRight: { display: "flex", alignItems: "center", gap: "0.5rem" },
  tecnicaChip: { padding: "0.2rem 0.5rem", borderRadius: "0.3rem", background: "#f1f5f9", fontSize: "0.75rem", color: "#374151" },
  flecha: { color: "#94a3b8", fontSize: "1.5rem" },
};