import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const esMobil = window.innerWidth < 768;
const diasAMostrar = esMobil ? 7 : 7;

const HORAS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00"
];
const DIAS_NOMBRES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function VistaSemanal({ fecha }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  const d = new Date(fecha);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(d.setDate(diff));
  lunes.setHours(0, 0, 0, 0);

  const diasFecha = Array.from({ length: diasAMostrar }, (_, i) => {
    const next = new Date(lunes);
    next.setDate(lunes.getDate() + i);
    return next;
  });

  function horaAMinutos(horaStr) {
    if (!horaStr) return -1;
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
  }

  useEffect(() => {
    cargarCitas();
  }, [fecha, user]);

  useEffect(() => {
  if (citaSeleccionada) {
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "0px";
  } else {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }
  return () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };
}, [citaSeleccionada]);

  async function cargarCitas() {
    if (!user) return;
    const formatYMD = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const inicio = formatYMD(diasFecha[0]);
    const fin = formatYMD(diasFecha[6]);
    try {
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
        where("fecha", ">=", inicio),
        where("fecha", "<=", fin)
      );
      const snap = await getDocs(q);
      setCitas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error:", err);
    }
  }

  function getCita(dia, horaFilaStr) {
    const y = dia.getFullYear();
    const m = String(dia.getMonth() + 1).padStart(2, "0");
    const dd = String(dia.getDate()).padStart(2, "0");
    const fechaStr = `${y}-${m}-${dd}`;
    const minFilaInicio = horaAMinutos(horaFilaStr);
    const minFilaFin = minFilaInicio + 30;
    return citas.find(c => {
      if (c.fecha !== fechaStr) return false;
      const minCita = horaAMinutos(c.hora);
      return minCita >= minFilaInicio && minCita < minFilaFin;
    });
  }

  async function marcarEstado(estado, motivoFalta = "") {
    if (!citaSeleccionada) return;
    setActualizando(true);
    try {
      await updateDoc(doc(db, "appointments", citaSeleccionada.id), {
        estado,
        ...(motivoFalta && { motivoFalta }),
      });
      setCitas(prev => prev.map(c =>
        c.id === citaSeleccionada.id ? { ...c, estado, motivoFalta } : c
      ));
      setCitaSeleccionada(prev => ({ ...prev, estado }));
    } catch (err) {
      console.error(err);
    }
    setActualizando(false);
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.tabla}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={styles.horaHeader}></div>
          {diasFecha.map((d, i) => (
            <div key={i} style={styles.diaHeader}>
              <span style={styles.diaNombre}>{DIAS_NOMBRES[i]}</span>
              <span style={{
                ...styles.diaNum,
                background: d.toDateString() === new Date().toDateString() ? "#2563eb" : "transparent",
                color: d.toDateString() === new Date().toDateString() ? "white" : "#1e293b"
              }}>{d.getDate()}</span>
            </div>
          ))}
        </div>

        {/* Horas */}
        {HORAS.map(h => (
          <div key={h} style={styles.row}>
            <div style={styles.horaCell}>{h}</div>
            {diasFecha.map((d, i) => {
              const cita = getCita(d, h);
              return (
                <div key={i} style={styles.cell}>
                  {cita && (
                    <div
                      onClick={() => setCitaSeleccionada(cita)}
                      style={{
                        ...styles.citaCard,
                        background: cita.color || "#2563eb",
                        opacity: cita.estado === "asistio" || cita.estado === "falto" ? 0.6 : 1,
                      }}
                    >
                      <span style={styles.citaTexto}>{cita.pacienteNombre}</span>
                      {cita.estado === "asistio" && <span style={styles.citaBadge}>✓</span>}
                      {cita.estado === "falto" && <span style={styles.citaBadge}>✗</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal */}
      {citaSeleccionada && (
        <div style={styles.modalOverlay} onClick={() => setCitaSeleccionada(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ ...styles.colorDot, background: citaSeleccionada.color || "#2563eb" }} />
              <div>
                <p style={styles.modalNombre}>{citaSeleccionada.pacienteNombre}</p>
                <p style={styles.modalInfo}>{citaSeleccionada.fecha} · {citaSeleccionada.hora}</p>
                <p style={styles.modalInfo}>{citaSeleccionada.motivo}</p>
              </div>
              <button style={styles.btnCerrar} onClick={() => setCitaSeleccionada(null)}>✕</button>
            </div>

            <div style={styles.modalEstado}>
              <p style={styles.modalLabel}>Estado actual:
                <strong style={{ color: estadoColor(citaSeleccionada.estado) }}>
                  {" "}{citaSeleccionada.estado}
                </strong>
              </p>
            </div>

            <div style={styles.modalBtns}>
              <button
                style={{ ...styles.btnAccion, background: "#22c55e" }}
                onClick={() => marcarEstado("asistio")}
                disabled={actualizando}
              >
                ✓ Asistió
              </button>
              <button
                style={{ ...styles.btnAccion, background: "#ef4444" }}
                onClick={() => marcarEstado("falto")}
                disabled={actualizando}
              >
                ✗ Faltó
              </button>
              <button
                style={{ ...styles.btnAccion, background: "#f59e0b" }}
                onClick={() => marcarEstado("pendiente")}
                disabled={actualizando}
              >
                ↺ Pendiente
              </button>
            </div>

            <div style={styles.modalAcciones}>
              <button
                style={styles.btnVerPaciente}
                onClick={() => navigate(`/pacientes/${citaSeleccionada.pacienteId}`)}
              >
                Ver ficha del paciente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function estadoColor(estado) {
  if (estado === "asistio") return "#22c55e";
  if (estado === "falto") return "#ef4444";
  return "#f59e0b";
}

const styles = {
  wrapper: { position: "relative" },
  tabla: { 
  background: "white", 
  borderRadius: "12px", 
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
  overflow: "auto",
  WebkitOverflowScrolling: "touch",
},
  headerRow: { 
  display: "grid", 
  gridTemplateColumns: `70px repeat(${esMobil ? 7 : 7}, 1fr)`, 
  borderBottom: "1px solid #e2e8f0", 
  background: "#f8fafc" 
},
  horaHeader: {},
  diaHeader: { padding: "10px", textAlign: "center", display: "flex", flexDirection: "column", gap: "4px", borderLeft: "1px solid #e2e8f0" },
  diaNombre: { fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  diaNum: { fontSize: "1rem", fontWeight: "700", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", borderRadius: "50%" },
  row: { 
  display: "grid", 
  gridTemplateColumns: `70px repeat(${esMobil ? 6 : 7}, 1fr)`, 
  borderBottom: "1px solid #f1f5f9", 
  minHeight: "45px" 
},
  horaCell: { fontSize: "0.7rem", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid #f1f5f9", fontWeight: "600" },
  cell: { borderLeft: "1px solid #f1f5f9", padding: "4px", position: "relative" },
  citaCard: { height: "100%", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  citaTexto: { color: "white", fontSize: "0.75rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  citaBadge: { color: "white", fontSize: "0.75rem", fontWeight: "700", marginLeft: "4px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "white", borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "380px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" },
  colorDot: { width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0, marginTop: "4px" },
  modalNombre: { margin: 0, fontWeight: "700", color: "#1e293b", fontSize: "1.1rem" },
  modalInfo: { margin: "0.15rem 0 0", color: "#64748b", fontSize: "0.85rem" },
  btnCerrar: { marginLeft: "auto", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8" },
  modalEstado: { marginBottom: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.5rem" },
  modalLabel: { margin: 0, fontSize: "0.9rem", color: "#374151" },
  modalBtns: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  btnAccion: { flex: 1, padding: "0.65rem", borderRadius: "0.5rem", border: "none", color: "white", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" },
  modalAcciones: { borderTop: "1px solid #f1f5f9", paddingTop: "1rem" },
  btnVerPaciente: { width: "100%", padding: "0.65rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", color: "#2563eb", fontWeight: "600", cursor: "pointer" },
};