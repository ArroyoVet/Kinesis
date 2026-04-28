import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext"; // <-- 1. Importamos el contexto

const MOTIVOS = ["Lumbalgia", "Hemiplejia", "Fascitis", "Cervicalgia", "Escoliosis", "Tendinitis", "Fractura", "Otro"];
const COLORES = ["#2563eb", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function NuevoEpisodio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- 2. Obtenemos el usuario logueado
  const DIAGNOSTICOS = {
    "Lumbalgia": "M54.5",
    "Hemiplejia": "G81.9",
    "Fascitis plantar": "M72.2",
    "Cervicalgia": "M53.0",
    "Escoliosis": "M41.9",
    "Tendinitis": "M77.9",
    "Fractura": "T14.2",
    "Otro": "" // Lo dejamos vacío para que lo llene manualmente
  };
  const [form, setForm] = useState({
    motivoConsulta: "",
    diagnosticoCIE10: "",
    color: "#2563eb",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaAlta: null,
    estado: "en curso",
    derivadoPor: "",
    seguro: "SIS",
    totalSesiones: 0,
    observacionesGenerales: "",
    motivoPersonalizado: "",
  });
  const [guardando, setGuardando] = useState(false);

  function handleMotivoChange(e) {
    const motivoSeleccionado = e.target.value;
    setForm({ 
      ...form, 
      motivoConsulta: motivoSeleccionado,
      // Busca en el diccionario. Si existe, pone el código. Si no, lo deja en blanco.
      diagnosticoCIE10: DIAGNOSTICOS[motivoSeleccionado] || "",
      motivoPersonalizado: "" // Limpiamos el campo "otro" si cambia de opinión
    });
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleGuardar() {
    if (!form.motivoConsulta) return alert("El motivo de consulta es obligatorio");
    setGuardando(true);
    try {
      await addDoc(collection(db, "patients", id, "episodes"), {
        ...form,
        userId: user.uid, // <-- 3. PRIVACIDAD: Asociamos el episodio al licenciado
        creadoEn: new Date().toISOString(),
      });
      // Actualizar estado y color del paciente
      await updateDoc(doc(db, "patients", id), {
          estado: "en curso",
          color: form.color,
          motivoConsulta: form.motivoConsulta,
          fecha_registro_estado: new Date().toISOString(), // <-- Para que el reporte sepa cuándo inició este nuevo ciclo
        });
      navigate(`/pacientes/${id}`);
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
    setGuardando(false);
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.btnVolver} onClick={() => navigate(`/pacientes/${id}`)}>← Volver</button>
          <h2 style={styles.titulo}>Nuevo Episodio</h2>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Motivo de consulta *</label>
          <select style={styles.input} name="motivoConsulta" value={form.motivoConsulta} onChange={handleChange}>
            <option value="">Seleccionar</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

            {form.motivoConsulta === "Otro" && (
            <input 
              style={{ ...styles.input, marginTop: "0.5rem", border: "1px solid #3b82f6" }} 
              name="motivoPersonalizado" 
              value={form.motivoPersonalizado} 
              onChange={handleChange} 
              placeholder="Escriba la lesión o motivo..." 
            />
          )}

          <label style={styles.label}>Diagnóstico CIE-10</label>
          <input 
            style={{ ...styles.input, backgroundColor: form.motivoConsulta && form.motivoConsulta !== "Otro" ? "#f1f5f9" : "white" }} 
            name="diagnosticoCIE10" 
            value={form.diagnosticoCIE10} 
            onChange={handleChange} 
            placeholder="Ej: M54.5" 
          />

          <label style={styles.label}>Fecha de inicio</label>
          <input style={styles.input} type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleChange} />

          <label style={styles.label}>Derivado por</label>
          <input style={styles.input} name="derivadoPor" value={form.derivadoPor} onChange={handleChange} placeholder="Ej: Dr. Ramos" />

          <label style={styles.label}>Seguro</label>
          <select style={styles.input} name="seguro" value={form.seguro} onChange={handleChange}>
            <option value="SIS">SIS</option>
            <option value="EsSalud">EsSalud</option>
            <option value="Particular">Particular</option>
          </select>

          <label style={styles.label}>Observaciones generales</label>
          <textarea
            style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
            name="observacionesGenerales"
            value={form.observacionesGenerales}
            onChange={handleChange}
            placeholder="Notas generales del episodio..."
          />

          <label style={styles.label}>Color en agenda</label>
          <div style={styles.coloresGrid}>
            {COLORES.map(c => (
              <div
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                style={{
                  ...styles.colorCircle,
                  background: c,
                  border: form.color === c ? "3px solid #1e293b" : "3px solid transparent",
                }}
              />
            ))}
          </div>

          <button style={styles.btnGuardar} onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar episodio"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "0.75rem 1rem", maxWidth: "600px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  titulo: { fontSize: "1.5rem", color: "#1e293b", margin: 0 },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem", background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  label: { fontWeight: "600", color: "#374151", fontSize: "0.9rem", marginTop: "0.5rem" },
  input: { padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", outline: "none" },
  coloresGrid: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" },
  colorCircle: { width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" },
  btnGuardar: {
    marginTop: "1rem", padding: "0.85rem", borderRadius: "0.5rem",
    background: "#2563eb", color: "white", border: "none",
    fontSize: "1rem", fontWeight: "600", cursor: "pointer",
  },
};