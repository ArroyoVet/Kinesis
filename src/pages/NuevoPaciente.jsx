import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

// 1. EL DICCIONARIO MÁGICO: Relaciona la enfermedad con su CIE-10
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

const COLORES = ["#2563eb", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function NuevoPaciente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lugares, setLugares] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    celular: "",
    fechaNacimiento: "",
    sexo: "",
    motivoConsulta: "",
    motivoPersonalizado: "", // <-- Nuevo estado para guardar el texto si elige "Otro"
    diagnosticoCIE10: "",
    color: "#2563eb",
    workplaceId: "",
    estado: "en curso",
  });

  useEffect(() => {
    async function cargarLugares() {
      if (!user) return;
      try {
        const q = query(collection(db, "workplaces"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        setLugares(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));
      } catch (error) {
        console.error("Error al cargar lugares:", error);
      }
    }
    cargarLugares();
  }, [user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 2. FUNCIÓN PARA AUTO-COMPLETAR EL CIE-10
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

  async function handleGuardar() {
    if (!form.nombre) return alert("El nombre es obligatorio");

    // Decidimos qué motivo guardar finalmente
    const motivoFinal = form.motivoConsulta === "Otro" 
      ? form.motivoPersonalizado 
      : form.motivoConsulta;

    if (!motivoFinal) return alert("Por favor especifique el motivo de consulta");

    setGuardando(true);
    try {
      const fechaActual = new Date().toISOString();
      const fechaSoloDia = fechaActual.split("T")[0]; // Ej: "2026-04-28"

      // Guardamos al paciente
      const docRef = await addDoc(collection(db, "patients"), {
        nombre: form.nombre,
        celular: form.celular,
        fechaNacimiento: form.fechaNacimiento,
        sexo: form.sexo,
        motivoConsulta: motivoFinal,
        diagnosticoCIE10: form.diagnosticoCIE10,
        fechaDiagnostico: fechaSoloDia, // <-- Guardamos la fecha de diagnóstico
        color: form.color,
        workplaceId: form.workplaceId,
        estado: "en curso",
        userId: user.uid,
        creadoEn: fechaActual,
        fecha_registro_estado: fechaActual
      });

      // Creamos automáticamente su primer episodio asociado a este motivo
      await addDoc(collection(db, "patients", docRef.id, "episodes"), {
        motivoConsulta: motivoFinal,
        diagnosticoCIE10: form.diagnosticoCIE10,
        fechaInicio: fechaSoloDia,
        estado: "en curso",
        color: form.color,
        userId: user.uid,
        creadoEn: fechaActual,
        fecha_registro_estado: fechaActual
      });
      
      navigate("/pacientes");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar el paciente");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.btnVolver} onClick={() => navigate("/pacientes")}>← Volver</button>
          <h2 style={styles.titulo}>Nuevo Paciente</h2>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Nombre completo *</label>
          <input style={styles.input} name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: María López" />

          <label style={styles.label}>Centro de trabajo *</label>
          <select style={styles.input} name="workplaceId" value={form.workplaceId} onChange={handleChange}>
            <option value="">Seleccionar lugar...</option>
            {lugares.map(lugar => (
              <option key={lugar.id} value={lugar.id}>{lugar.nombre}</option>
            ))}
          </select>

          <label style={styles.label}>Celular</label>
          <input style={styles.input} name="celular" value={form.celular} onChange={handleChange} placeholder="987654321" />

          <label style={styles.label}>Fecha de nacimiento</label>
          <input style={styles.input} type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />

          <label style={styles.label}>Sexo</label>
          <select style={styles.input} name="sexo" value={form.sexo} onChange={handleChange}>
            <option value="">Seleccionar</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>

          {/* Selector de Motivo con auto-completado */}
          <label style={styles.label}>Motivo de consulta</label>
          <select style={styles.input} name="motivoConsulta" value={form.motivoConsulta} onChange={handleMotivoChange}>
            <option value="">Seleccionar</option>
            {Object.keys(DIAGNOSTICOS).map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* CONDICIONAL: Aparece solo si elige "Otro" */}
          {form.motivoConsulta === "Otro" && (
            <input 
              style={{ ...styles.input, marginTop: "0.5rem", border: "1px solid #3b82f6" }} 
              name="motivoPersonalizado" 
              value={form.motivoPersonalizado} 
              onChange={handleChange} 
              placeholder="Escriba la lesión o motivo..." 
            />
          )}

          {/* El CIE-10 se llena solo, pero se puede editar manualmente */}
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
            {guardando ? "Guardando..." : "Guardar paciente"}
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