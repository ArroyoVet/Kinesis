import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, collection, getDocs, orderBy, query, deleteDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext"; // Importar arriba


export default function DetallePaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [paciente, setPaciente] = useState(null);
  const [episodios, setEpisodios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const docRef = doc(db, "patients", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPaciente({ id: docSnap.id, ...docSnap.data() });
        const epSnap = await getDocs(
          query(collection(db, "patients", id, "episodes"), orderBy("fechaInicio", "desc"))
        );
        setEpisodios(epSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    }
    cargar();
  }, [id]);

  function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return "—";
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad + " años";
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>;
  if (!paciente) return <div style={styles.loading}>Paciente no encontrado</div>;

async function handleEliminarPaciente() {
    const confirmar = window.confirm(
      "¿Estás seguro de eliminar a este paciente? Esta acción ocultará su expediente por completo."
    );
    
    if (confirmar) {
      try {
        await deleteDoc(doc(db, "patients", id));
        navigate("/pacientes"); // Lo regresamos a la lista general
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <button style={styles.btnVolver} onClick={() => navigate("/pacientes")}>← Volver</button>

        {/* Ficha del paciente */}
        <div style={styles.ficha}>
          <div style={styles.perfilHeader}>
            <div style={{ ...styles.colorDot, background: paciente.color || "#2563eb" }} />
            <div>
              <h2 style={styles.nombrePaciente}>{paciente.nombre}</h2>
              <p style={styles.subinfo}>
                {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Femenino" : "Sin especificar"} 
                {paciente.fechaNacimiento ? ` · Nacimiento: ${paciente.fechaNacimiento}` : ""}
              </p>
            </div>
            
            {/* Agrupamos los botones a la derecha */}
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              
              {/* Botón de Eliminar (Solo licenciado) */}
              {role !== "admin" && (
                <button 
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", cursor: "pointer", fontWeight: "500" }} 
                  onClick={handleEliminarPaciente}
                >
                  🗑️ Eliminar
                </button>
              )}

              <button style={styles.btnEditar} onClick={() => navigate(`/pacientes/${id}/editar`)}>
                ✏️ Editar
              </button>
            </div>
          </div>

          <div style={styles.datosGrid}>
            <div style={styles.dato}><span style={styles.datoLabel}>Celular</span><span>{paciente.celular || "—"}</span></div>
            <div style={styles.dato}><span style={styles.datoLabel}>Fecha de nacimiento</span><span>{paciente.fechaNacimiento || "—"}</span></div>
            <div style={styles.dato}><span style={styles.datoLabel}>Diagnóstico</span><span>{paciente.diagnosticoCIE10 || "—"}</span></div>
            <div style={styles.dato}><span style={styles.datoLabel}>Lugar de trabajo</span><span>{paciente.workplaceId || "—"}</span></div>
          </div>
        </div>

        {/* Episodios */}
        <div style={styles.seccion}>
          <div style={styles.seccionHeader}>
            <h3 style={styles.seccionTitulo}>Episodios de tratamiento</h3>
            {role !== "admin" && (
            <button style={styles.btnNuevo} onClick={() => navigate(`/pacientes/${id}/nuevo-episodio`)}>
              + Nuevo episodio
            </button>
            )}
          </div>

          {episodios.length === 0 && <p style={styles.vacio}>No hay episodios registrados</p>}

          {episodios.map(ep => (
            <div key={ep.id} style={styles.episodioCard} onClick={() => navigate(`/pacientes/${id}/episodios/${ep.id}`)}>
              <div style={styles.epLeft}>
                <div style={{ ...styles.epDot, background: ep.color || "#2563eb" }} />
                <div>
                  <p style={styles.epMotivo}>{ep.motivoConsulta}</p>
                  <p style={styles.epFecha}>Inicio: {ep.fechaInicio} · Sesiones: {ep.totalSesiones || 0}</p>
                </div>
              </div>
              <div style={styles.epRight}>
                <span style={{ ...styles.badge, background: badgeColor(ep.estado) }}>{ep.estado}</span>
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
  container: { padding: "1.5rem", maxWidth: "800px", margin: "0 auto" },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem", fontWeight: "500", marginBottom: "1rem" },
  ficha: { background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: "1.5rem" },
  fichaHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" },
  colorDot: { width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0 },
  nombre: { margin: 0, fontSize: "1.4rem", color: "#1e293b" },
  subinfo: { margin: 0, color: "#64748b", fontSize: "0.9rem" },
  btnEditar: { marginLeft: "auto", padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: "500" },
  datosGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" },
  dato: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  datoLabel: { fontSize: "0.78rem", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" },
  seccion: { background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  seccionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  seccionTitulo: { margin: 0, color: "#1e293b" },
  btnNuevo: { padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", cursor: "pointer", fontWeight: "600" },
  vacio: { color: "#94a3b8", textAlign: "center", padding: "1rem" },
  episodioCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #f1f5f9", cursor: "pointer", marginBottom: "0.5rem" },
  epLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  epDot: { width: "12px", height: "12px", borderRadius: "50%" },
  epMotivo: { margin: 0, fontWeight: "600", color: "#1e293b" },
  epFecha: { margin: 0, fontSize: "0.82rem", color: "#64748b" },
  epRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  badge: { padding: "0.25rem 0.75rem", borderRadius: "999px", color: "white", fontSize: "0.78rem", fontWeight: "600" },
  flecha: { color: "#94a3b8", fontSize: "1.5rem" },
};