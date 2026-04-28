import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const MOTIVOS = ["Lumbalgia", "Hemiplejia", "Fascitis", "Cervicalgia", "Escoliosis", "Tendinitis", "Fractura", "Otro"];
const COLORES = ["#2563eb", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function NuevoPaciente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lugares, setLugares] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // El estado 'form' nace aquí
  const [form, setForm] = useState({
    nombre: "",
    celular: "",
    fechaNacimiento: "",
    sexo: "",
    motivoConsulta: "",
    diagnosticoCIE10: "",
    color: "#2563eb",
    workplaceId: "", // Vacío por defecto para obligar a seleccionar
    estado: "en curso",
  });

  // Cargamos los lugares del licenciado
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

  // La función de guardar usa el 'form' correctamente aquí adentro
  async function handleGuardar() {
  if (!form.nombre) return alert("El nombre es obligatorio");

  try {
    await addDoc(collection(db, "patients"), {
      ...form,
      userId: user.uid,
      creadoEn: new Date().toISOString(),
      estado: "en curso" // Estado inicial por defecto
    });
    
    navigate("/pacientes");
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Error al guardar el paciente");
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

          {/* Selector de Centro de Trabajo */}
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

          <label style={styles.label}>Motivo de consulta</label>
          <select style={styles.input} name="motivoConsulta" value={form.motivoConsulta} onChange={handleChange}>
            <option value="">Seleccionar</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <label style={styles.label}>Diagnóstico CIE-10</label>
          <input style={styles.input} name="diagnosticoCIE10" value={form.diagnosticoCIE10} onChange={handleChange} placeholder="Ej: M54.5" />

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