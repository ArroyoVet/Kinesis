import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const MOTIVOS = ["Lumbalgia", "Hemiplejia", "Fascitis", "Cervicalgia", "Escoliosis", "Tendinitis", "Fractura", "Otro"];
const COLORES = ["#2563eb", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function EditarPaciente() {
  const { id } = useParams(); // ID del paciente a editar
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lugares, setLugares] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombre: "",
    celular: "",
    fechaNacimiento: "",
    sexo: "",
    motivoConsulta: "",
    diagnosticoCIE10: "",
    color: "#2563eb",
    workplaceId: "",
    estado: "en curso",
  });

  // 1. Cargar los lugares de trabajo Y los datos actuales del paciente
  useEffect(() => {
    async function cargarDatos() {
      if (!user) return;
      try {
        // Cargar lugares de trabajo
        const q = query(collection(db, "workplaces"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        setLugares(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));

        // Cargar los datos del paciente para rellenar el formulario
        const pacienteRef = doc(db, "patients", id);
        const pacienteSnap = await getDoc(pacienteRef);
        
        if (pacienteSnap.exists()) {
          // Rellenamos el estado con lo que ya estaba en la base de datos
          setForm({ ...form, ...pacienteSnap.data() });
        } else {
          alert("El paciente no existe");
          navigate("/pacientes");
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      }
      setLoading(false);
    }
    cargarDatos();
  }, [id, user, navigate]); // dependencias

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 2. Usar updateDoc en lugar de addDoc
  async function handleGuardar() {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");

    setGuardando(true);
    try {
      const pacienteRef = doc(db, "patients", id);
      await updateDoc(pacienteRef, {
        nombre: form.nombre,
        celular: form.celular,
        fechaNacimiento: form.fechaNacimiento,
        sexo: form.sexo,
        motivoConsulta: form.motivoConsulta,
        diagnosticoCIE10: form.diagnosticoCIE10,
        color: form.color,
        workplaceId: form.workplaceId,
        estado: form.estado // Por si el admin lo da de alta
      });
      // Volvemos al perfil del paciente
      navigate(`/pacientes/${id}`);
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
    setGuardando(false);
  }

  if (loading) return <div style={styles.loading}>Cargando datos del paciente...</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.btnVolver} onClick={() => navigate(`/pacientes/${id}`)}>← Cancelar</button>
          <h2 style={styles.titulo}>Editar Paciente</h2>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Nombre completo *</label>
          <input style={styles.input} name="nombre" value={form.nombre} onChange={handleChange} />

          <label style={styles.label}>Centro de trabajo *</label>
          <select style={styles.input} name="workplaceId" value={form.workplaceId} onChange={handleChange}>
            <option value="">Seleccionar lugar...</option>
            {lugares.map(lugar => (
              <option key={lugar.id} value={lugar.id}>{lugar.nombre}</option>
            ))}
          </select>

          <label style={styles.label}>Estado del Paciente</label>
          <select style={styles.input} name="estado" value={form.estado} onChange={handleChange}>
            <option value="en curso">En curso</option>
            <option value="alta">Alta médica</option>
            <option value="abandono">Abandono</option>
          </select>

          <label style={styles.label}>Celular</label>
          <input style={styles.input} name="celular" value={form.celular} onChange={handleChange} />

          <label style={styles.label}>Fecha de nacimiento</label>
          <input style={styles.input} type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} />

          <label style={styles.label}>Sexo</label>
          <select style={styles.input} name="sexo" value={form.sexo} onChange={handleChange}>
            <option value="">Seleccionar</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>

          <label style={styles.label}>Motivo de consulta principal</label>
          <select style={styles.input} name="motivoConsulta" value={form.motivoConsulta} onChange={handleChange}>
            <option value="">Seleccionar</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <label style={styles.label}>Diagnóstico CIE-10</label>
          <input style={styles.input} name="diagnosticoCIE10" value={form.diagnosticoCIE10} onChange={handleChange} />

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
            {guardando ? "Actualizando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { padding: "3rem", textAlign: "center", color: "#64748b", fontSize: "1.2rem" },
  container: { padding: "1.5rem", maxWidth: "600px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  titulo: { fontSize: "1.5rem", color: "#1e293b", margin: 0 },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem", background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  label: { fontWeight: "600", color: "#374151", fontSize: "0.9rem", marginTop: "0.5rem" },
  input: { padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", outline: "none" },
  coloresGrid: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" },
  colorCircle: { width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" },
  btnGuardar: { marginTop: "1rem", padding: "0.85rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }
};