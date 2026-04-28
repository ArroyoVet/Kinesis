import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy, where, doc, deleteDoc, updateDoc, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null);
  
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    async function cargar() {
      if (!user) return;
      try {
        let q;
        if (role === "admin") {
          q = collection(db, "patients");
        } else {
          q = query(
            collection(db, "patients"), 
            where("userId", "==", user.uid)
          );
        }
        
        const snap = await getDocs(q);
        const listaOrdenada = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
          
        setPacientes(listaOrdenada);
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
      }
    }
    cargar();
  }, [user, role]);

  async function confirmarEliminacion() {
    if (!pacienteAEliminar) return;
    try {
      await deleteDoc(doc(db, "patients", pacienteAEliminar.id));
      setPacientes(pacientes.filter(p => p.id !== pacienteAEliminar.id));
      setPacienteAEliminar(null);
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  }

  // NUEVA FUNCIÓN: Cambiar el estado directamente desde la lista
  async function handleCambiarEstadoDirecto(pacienteId, nuevoEstado) {
  // Normalizamos el texto (Ej: "en curso" -> "En curso")
  const estadoFormateado = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1);

  try {
    const fechaRegistro = new Date().toISOString();

    // 1. Actualizamos el documento del Paciente (lo que ves en la lista)
    const pacienteRef = doc(db, "patients", pacienteId);
    await updateDoc(pacienteRef, { 
      estado: estadoFormateado,
      fecha_registro_estado: fechaRegistro 
    });

    // 2. BUSCAMOS EL EPISODIO ACTIVO PARA SINCRONIZAR
    // Traemos el último episodio creado para este paciente
    const qEpisodios = query(
      collection(db, "patients", pacienteId, "episodes"),
      orderBy("creadoEn", "desc"),
      limit(1)
    );
    const snapEp = await getDocs(qEpisodios);

    if (!snapEp.empty) {
      const epId = snapEp.docs[0].id;
      const epRef = doc(db, "patients", pacienteId, "episodes", epId);
      await updateDoc(epRef, { 
        estado: estadoFormateado,
        fecha_registro_estado: fechaRegistro 
      });
    }

    // 3. Actualizamos el estado local para que la UI se vea bien
    setPacientes(prev => prev.map(p => 
      p.id === pacienteId ? { ...p, estado: estadoFormateado } : p
    ));

  } catch (error) {
    console.error("Error al sincronizar estado:", error);
  }
}

  const filtrados = pacientes.filter(p => {
    const coincideBusqueda = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFiltro = filtro === "todos" || p.estado === filtro;
    return coincideBusqueda && coincideFiltro;
  });

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.titulo}>Pacientes</h2>
          
          {role !== "admin" && (
            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                style={{...styles.btnNuevo, background: "white", color: "#2563eb", border: "1px solid #2563eb"}} 
                onClick={() => navigate("/nueva-cita")}
              >
                📅 Nueva cita
              </button>
              <button style={styles.btnNuevo} onClick={() => navigate("/pacientes/nuevo")}>
                + Nuevo paciente
              </button>
            </div>
          )}
        </div>

        <div style={styles.controles}>
          <input
            style={styles.buscador}
            placeholder="🔍 Buscar paciente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div style={styles.filtros}>
            {["todos", "en curso", "alta", "abandono"].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  ...styles.filtroBtn,
                  background: filtro === f ? "#2563eb" : "white",
                  color: filtro === f ? "white" : "#374151",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.lista}>
          {filtrados.length === 0 && (
            <p style={styles.vacio}>No se encontraron pacientes</p>
          )}
          {filtrados.map(p => (
            <div key={p.id} style={styles.card} onClick={() => navigate(`/pacientes/${p.id}`)}>
              <div style={styles.cardLeft}>
                <div style={{ ...styles.colorDot, background: p.color || "#2563eb" }} />
                <div>
                  <p style={styles.nombre}>{p.nombre}</p>
                  <p style={styles.detalle}>{p.motivoConsulta || "Sin motivo registrado"}</p>
                </div>
              </div>
              <div style={styles.cardRight}>
                
                {/* REEMPLAZO: SELECT INTERACTIVO EN LUGAR DE SPAN */}
                <select
                  value={p.estado || "en curso"}
                  onClick={(e) => e.stopPropagation()} // Evita que se abra el perfil al hacer clic en el select
                  onChange={(e) => handleCambiarEstadoDirecto(p.id, e.target.value)}
                  style={{
                    ...styles.badgeSelect,
                    background: badgeColor(p.estado)
                  }}
                >
                  <option value="en curso">En curso</option>
                  <option value="alta">Alta médica</option>
                  <option value="abandono">Abandono</option>
                </select>

                {role !== "admin" && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPacienteAEliminar(p);
                    }}
                    style={styles.btnBasura}
                    title="Eliminar paciente"
                  >
                    🗑️
                  </button>
                )}
                
                <span style={styles.flecha}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {pacienteAEliminar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitulo}>⚠️ ¿Eliminar Paciente?</h3>
            <p style={styles.modalTexto}>
              Estás a punto de eliminar el expediente de <strong>{pacienteAEliminar.nombre}</strong>.
            </p>
            <p style={styles.modalTextoSecundario}>
              Esta acción es irreversible y borrará todo su historial.
            </p>
            
            <div style={styles.modalBotones}>
              <button 
                style={styles.btnCancelarModal} 
                onClick={() => setPacienteAEliminar(null)}
              >
                Cancelar
              </button>
              <button 
                style={styles.btnEliminarModal} 
                onClick={confirmarEliminacion}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function badgeColor(estado) {
  if (estado === "alta") return "#22c55e";
  if (estado === "abandono") return "#ef4444";
  return "#2563eb"; // en curso
}

const styles = {
  container: { padding: "0.75rem 1rem", maxWidth: "900px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  titulo: { fontSize: "1.75rem", color: "#1e293b", margin: 0 },
  btnNuevo: { padding: "0.6rem 1.25rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" },
  controles: { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" },
  buscador: { padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", outline: "none" },
  filtros: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  filtroBtn: { padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", cursor: "pointer", fontWeight: "500" },
  lista: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  vacio: { textAlign: "center", color: "#94a3b8", marginTop: "2rem" },
  card: { background: "white", borderRadius: "0.75rem", padding: "1rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #f1f5f9" },
  cardLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  colorDot: { width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0 },
  nombre: { margin: 0, fontWeight: "600", color: "#1e293b", fontSize: "1rem" },
  detalle: { margin: 0, color: "#64748b", fontSize: "0.85rem" },
  cardRight: { display: "flex", alignItems: "center", gap: "0.75rem" },
  btnBasura: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", padding: "0 0.5rem" },
  flecha: { color: "#94a3b8", fontSize: "1.5rem" },
  
  // Nuevo estilo para el select interactivo
  badgeSelect: { padding: "0.25rem 0.75rem", borderRadius: "999px", color: "white", fontSize: "0.78rem", fontWeight: "600", border: "none", outline: "none", cursor: "pointer", appearance: "none", textAlign: "center" },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "white", padding: "2rem", borderRadius: "1rem", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" },
  modalTitulo: { margin: "0 0 1rem 0", color: "#ef4444", fontSize: "1.4rem" },
  modalTexto: { margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.05rem" },
  modalTextoSecundario: { margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.9rem" },
  modalBotones: { display: "flex", justifyContent: "flex-end", gap: "1rem" },
  btnCancelarModal: { padding: "0.6rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", color: "#475569", cursor: "pointer", fontWeight: "600" },
  btnEliminarModal: { padding: "0.6rem 1rem", borderRadius: "0.5rem", border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontWeight: "600" },
};