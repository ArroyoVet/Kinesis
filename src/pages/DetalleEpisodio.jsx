import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc, getDoc, collection, getDocs, orderBy, query, deleteDoc } from "firebase/firestore";
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

  // Estados para la ventana de gracia del cambio de estado
  const [timerId, setTimerId] = useState(null);
  const [estadoOriginal, setEstadoOriginal] = useState(null);
  const [cambioPendiente, setCambioPendiente] = useState(false);

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

  // Limpiar el timer si el componente se desmonta para evitar fugas de memoria
  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  async function handleEliminarEpisodio() {
    if (window.confirm("¿Estás seguro de eliminar este episodio de tratamiento?")) {
      try {
        await deleteDoc(doc(db, "patients", id, "episodes", epId));
        navigate(`/pacientes/${id}`);
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  }

  // Lógica de cambio de estado con ventana de gracia
  // 1. EL CAMBIO AHORA ES INMEDIATO EN FIREBASE
  async function handleCambioConGracia(nuevoEstado) {
    if (nuevoEstado === episodio.estado) return;

    // Guardamos el estado original por si quiere deshacer
    if (!cambioPendiente) {
      setEstadoOriginal(episodio.estado);
    }

    const fechaRegistro = new Date().toISOString();

    try {
      // A. GUARDAMOS EN FIREBASE AL INSTANTE
      const epRef = doc(db, "patients", id, "episodes", epId);
      await updateDoc(epRef, { estado: nuevoEstado, fecha_registro_estado: fechaRegistro });
      
      const pacRef = doc(db, "patients", id);
      await updateDoc(pacRef, { estado: nuevoEstado, fecha_registro_estado: fechaRegistro });

      // B. ACTUALIZAMOS LA PANTALLA VISUALMENTE
      setEpisodio(prev => ({ ...prev, estado: nuevoEstado }));
      setCambioPendiente(true);

      // C. EL TEMPORIZADOR AHORA SOLO SIRVE PARA OCULTAR EL BOTÓN "DESHACER"
      if (timerId) clearTimeout(timerId);
      const newTimer = setTimeout(() => {
        setCambioPendiente(false);
        setEstadoOriginal(null);
      }, 60000); // 1 minuto (60000 ms) para que desaparezca el aviso
      setTimerId(newTimer);

    } catch (e) {
      console.error("Error guardando el estado:", e);
      alert("Hubo un error de conexión.");
    }
  }

  // 2. EL BOTÓN DESHACER VUELVE A ESCRIBIR EN FIREBASE
  async function cancelarCambio() {
    if (timerId) clearTimeout(timerId);
    
    const estadoAnterior = estadoOriginal || "en curso";
    
    try {
      // Revertimos en Firebase al instante
      const epRef = doc(db, "patients", id, "episodes", epId);
      await updateDoc(epRef, { estado: estadoAnterior });
      
      const pacRef = doc(db, "patients", id);
      await updateDoc(pacRef, { estado: estadoAnterior });

      // Revertimos en la pantalla
      setEpisodio(prev => ({ ...prev, estado: estadoAnterior }));
      setCambioPendiente(false);
      setEstadoOriginal(null);
    } catch (e) {
      console.error("Error al deshacer:", e);
    }
  }

  function cancelarCambio() {
    if (timerId) clearTimeout(timerId);
    setEpisodio(prev => ({ ...prev, estado: estadoOriginal || "en curso" }));
    setCambioPendiente(false);
    setEstadoOriginal(null);
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
      
      {/* 1. SECCIÓN SUPERIOR: Datos del Paciente (Nombre, edad, etc.) */}
      <div style={styles.headerPaciente}>
        <h2>{paciente.nombre}</h2>
        <p>Teléfono: {paciente.telefono}</p>
      </div>

      {/* 2. SECCIÓN INFERIOR: Historial de Episodios */}
      <div style={styles.seccionEpisodios}>
        <h3>Historial de Tratamientos</h3>
        <button onClick={crearNuevoEpisodio}>+ Nuevo Episodio</button>

        {/* AQUÍ ES DONDE VA EL MAP: Si no hay episodios, muestra vacío */}
        {episodios.length === 0 ? (
          <p>Este paciente aún no tiene tratamientos registrados.</p>
        ) : (
          /* Si sí hay episodios, React usa el map para dibujar cada tarjeta */
          <div style={styles.listaEpisodios}>
            
            {episodios.map((ep) => (
              
              /* ESTA ES LA TARJETA INDIVIDUAL DE CADA EPISODIO */
              <div key={ep.id} style={styles.episodioCard} onClick={() => irAlDetalle(ep.id)}>
                
                {/* Lado izquierdo de la tarjeta: Info del episodio */}
                <div style={styles.cardLeft}>
                  <h4>{ep.motivoConsulta}</h4>
                  <p>Inició: {ep.fechaInicio}</p>
                </div>

                {/* Lado derecho de la tarjeta: El selector de estado */}
                <div style={styles.cardRight}>
                  
                  {/* Aviso de guardado (opcional) */}
                  {episodiosPendientes[ep.id] && <span>⏳ Guardando...</span>}

                  {/* EL SELECTOR INTERACTIVO */}
                  <select
                    value={ep.estado || "en curso"}
                    onClick={(e) => e.stopPropagation()} // Esto evita que al hacer clic en el select, entres al episodio por accidente
                    onChange={(e) => handleCambioEstadoEpisodio(ep.id, e.target.value, ep.estado)}
                    style={{ ...styles.badgeSelect, background: badgeColor(ep.estado) }}
                  >
                    <option value="en curso">En curso</option>
                    <option value="alta">Alta</option>
                    <option value="abandono">Abandono</option>
                  </select>
                  
                </div>
              </div>
              /* FIN DE LA TARJETA INDIVIDUAL */

            ))}

          </div>
        )}
      </div>

    </div>
  </div>
);
}

function badgeColor(estado) {
  if (estado === "alta") return "#22c55e";
  if (estado === "abandono") return "#ef4444";
  return "#2563eb"; // en curso
}

const styles = {
  loading: { padding: "2rem", textAlign: "center", color: "#64748b" },
  container: { padding: "0.75rem 1rem", maxWidth: "800px", margin: "0 auto" },
  btnVolver: { background: "none", border: "none", color: "#185FA5", cursor: "pointer", fontSize: "1rem", fontWeight: "500", marginBottom: "1rem" },
  header: { display: "flex", alignItems: "center", gap: "0.75rem", background: "white", padding: "1rem", borderRadius: "1rem", border: "0.5px solid #e2e8f0", marginBottom: "1rem" },
  colorDot: { width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0 },
  titulo: { margin: 0, fontSize: "1.2rem", color: "#1e293b" },
  subinfo: { margin: 0, color: "#64748b", fontSize: "0.82rem" },
  
  // Nuevos estilos para el Selector y el Banner de Deshacer
  badgeSelect: { padding: "0.25rem 0.65rem", borderRadius: "999px", color: "white", fontSize: "0.75rem", fontWeight: "600", border: "none", outline: "none", cursor: "pointer", appearance: "none", textAlign: "center" },
  undoBanner: { background: "#fffbeb", color: "#b45309", padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", border: "1px solid #fde68a" },
  btnUndo: { background: "#b45309", color: "white", border: "none", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" },
  
  dashboardContainer: { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" },
  chartSection: { background: "white", borderRadius: "1rem", padding: "1rem", border: "0.5px solid #e2e8f0", width: "100%", boxSizing: "border-box" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.65rem", width: "100%" },
  statCard: { background: "white", borderRadius: "0.75rem", padding: "0.85rem", border: "0.5px solid #e2e8f0", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.2rem" },
  statNum: { fontSize: "1.5rem", fontWeight: "700", color: "#185FA5" },
  statLabel: { fontSize: "0.75rem", color: "#64748b" },
  seccion: { background: "white", borderRadius: "1rem", padding: "1rem", border: "0.5px solid #e2e8f0" },
  seccionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  seccionTitulo: { margin: 0, color: "#1e293b", fontSize: "1rem" },
  btnNuevo: { padding: "0.5rem 0.85rem", borderRadius: "0.5rem", background: "#185FA5", color: "white", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.875rem" },
  vacio: { color: "#94a3b8", textAlign: "center", padding: "1rem" },
  sesionCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem", borderRadius: "0.75rem", border: "0.5px solid #f1f5f9", cursor: "pointer", marginBottom: "0.5rem" },
  sesionLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  sesionNum: { fontSize: "1rem", fontWeight: "700", color: "#185FA5", minWidth: "28px" },
  sesionFecha: { margin: 0, fontWeight: "600", color: "#1e293b", fontSize: "0.875rem" },
  sesionDetalle: { margin: 0, fontSize: "0.78rem", color: "#64748b" },
  sesionRight: { display: "flex", alignItems: "center", gap: "0.4rem" },
  tecnicaChip: { padding: "0.2rem 0.4rem", borderRadius: "0.3rem", background: "#f1f5f9", fontSize: "0.7rem", color: "#374151" },
  flecha: { color: "#94a3b8", fontSize: "1.25rem" },
};