import { useState } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

// 1. EL DICCIONARIO
const DIAGNOSTICOS = {
  "Lumbalgia": "M54.5",
  "Hemiplejia": "G81.9",
  "Fascitis plantar": "M72.2",
  "Cervicalgia": "M53.0",
  "Escoliosis": "M41.9",
  "Tendinitis": "M77.9",
  "Fractura": "T14.2",
  "Otro": "" 
};

const COLORES = ["#2563eb", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function NuevoEpisodio() {
  const { id } = useParams(); // Obtenemos el ID del paciente de la URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    motivoConsulta: "",
    motivoPersonalizado: "", // Para cuando elige "Otro"
    diagnosticoCIE10: "",
    color: "#2563eb",
  });

  // Función genérica para textos normales
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 2. LA MAGIA DEL AUTO-COMPLETADO
  function handleMotivoChange(e) {
    const motivoSeleccionado = e.target.value;
    setForm({ 
      ...form, 
      motivoConsulta: motivoSeleccionado,
      // Busca el código en el diccionario. Si no está, lo deja en blanco
      diagnosticoCIE10: DIAGNOSTICOS[motivoSeleccionado] || "",
      motivoPersonalizado: "" // Limpia el campo "otro"
    });
  }

  async function handleGuardar() {
    // Definir cuál es el motivo real a guardar
    const motivoFinal = form.motivoConsulta === "Otro" 
      ? form.motivoPersonalizado 
      : form.motivoConsulta;

    if (!motivoFinal) return alert("El motivo de consulta es obligatorio");

    setGuardando(true);
    try {
      const fechaActual = new Date().toISOString();
      const fechaSoloDia = fechaActual.split("T")[0]; // Ej: "2026-04-28"

      // A. Crear el nuevo episodio en la subcolección
      await addDoc(collection(db, "patients", id, "episodes"), {
        motivoConsulta: motivoFinal,
        diagnosticoCIE10: form.diagnosticoCIE10,
        color: form.color,
        estado: "en curso", // Nace en curso
        fechaInicio: fechaSoloDia,
        userId: user.uid,
        creadoEn: fechaActual,
        fecha_registro_estado: fechaActual
      });

      // B. LA REGLA DE ORO: Sincronizar y revivir al paciente globalmente
      await updateDoc(doc(db, "patients", id), {
        estado: "en curso",
        color: form.color,
        motivoConsulta: motivoFinal,
        diagnosticoCIE10: form.diagnosticoCIE10, // Actualizamos el diagnóstico en su ficha principal
        fechaDiagnostico: fechaSoloDia,         // Actualizamos la fecha de diagnóstico
        fecha_registro_estado: fechaActual
      });

      // Regresamos al perfil del paciente
      navigate(`/pacientes/${id}`);
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.btnVolver} onClick={() => navigate(`/pacientes/${id}`)}>← Volver</button>
          <h2 style={styles.titulo}>Nuevo Tratamiento</h2>
        </div>

        <div style={styles.form}>
          
          {/* Selector de Motivo con onChange especial (handleMotivoChange) */}
          <label style={styles.label}>Motivo de consulta *</label>
          <select style={styles.input} name="motivoConsulta" value={form.motivoConsulta} onChange={handleMotivoChange}>
            <option value="">Seleccionar</option>
            {Object.keys(DIAGNOSTICOS).map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Campo que aparece solo si elige "Otro" */}
          {form.motivoConsulta === "Otro" && (
            <input 
              style={{ ...styles.input, marginTop: "0.5rem", border: "1px solid #3b82f6" }} 
              name="motivoPersonalizado" 
              value={form.motivoPersonalizado} 
              onChange={handleChange} 
              placeholder="Escriba la lesión o motivo..." 
            />
          )}

          {/* Código CIE-10 (Se llena solo pero permite edición) */}
          <label style={styles.label}>Diagnóstico CIE-10</label>
          <input 
            style={{ ...styles.input, backgroundColor: form.motivoConsulta && form.motivoConsulta !== "Otro" ? "#f1f5f9" : "white" }} 
            name="diagnosticoCIE10" 
            value={form.diagnosticoCIE10} 
            onChange={handleChange} 
            placeholder="Ej: M54.5" 
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
            {guardando ? "Iniciando tratamiento..." : "Iniciar tratamiento"}
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