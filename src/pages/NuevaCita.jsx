import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom"; // <-- Agregamos useLocation
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function NuevaCita() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- Esto atrapa los datos enviados desde otra pantalla
  const { user, role } = useAuth();

  const [pacientes, setPacientes] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // Inicializamos el formulario. Si venimos de un perfil, pacienteId ya viene lleno.
  const [form, setForm] = useState({
    pacienteId: location.state?.pacienteId || "", 
    pacienteNombre: "",
    workplaceId: "",
    fecha: new Date().toISOString().split("T")[0],
    hora: "08:00",
    motivo: "",
    color: "#2563eb",
    estado: "pendiente"
  });

  useEffect(() => {
    async function cargarDatos() {
      if (!user) return;
      try {
        // 1. Cargar Pacientes (Si es admin ve todos, si es licenciado ve los suyos)
        let qP = role === "admin" 
          ? collection(db, "patients") 
          : query(collection(db, "patients"), where("userId", "==", user.uid));
        
        const snapP = await getDocs(qP);
        const listaPacientes = snapP.docs.map(d => ({ id: d.id, ...d.data() }));
        setPacientes(listaPacientes);

        // 2. Cargar Lugares
        let qL = role === "admin"
          ? collection(db, "workplaces")
          : query(collection(db, "workplaces"), where("userId", "==", user.uid));
        
        const snapL = await getDocs(qL);
        setLugares(snapL.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));

        // 3. LA MAGIA DEL AUTO-COMPLETADO
        // Si entramos con un paciente ya preseleccionado desde la otra pantalla
        const idPreseleccionado = location.state?.pacienteId;
        if (idPreseleccionado) {
          const p = listaPacientes.find(pac => pac.id === idPreseleccionado);
          if (p) {
            setForm(prev => ({
              ...prev,
              pacienteNombre: p.nombre,
              color: p.color || "#2563eb",
              motivo: p.motivoConsulta || "",
              workplaceId: p.workplaceId || prev.workplaceId
            }));
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    }
    cargarDatos();
  }, [user, role, location.state]);

  // Si seleccionamos manualmente otro paciente en el desplegable
  function handleChange(e) {
    const { name, value } = e.target;
    
    if (name === "pacienteId") {
      const p = pacientes.find(prev => prev.id === value);
      if (p) {
        setForm({ 
          ...form, 
          pacienteId: value, 
          pacienteNombre: p.nombre,
          color: p.color || "#2563eb",
          motivo: p.motivoConsulta || "",
          workplaceId: p.workplaceId || form.workplaceId
        });
      } else {
        setForm({ ...form, pacienteId: "", pacienteNombre: "" });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleGuardar() {
    if (!form.pacienteId || !form.workplaceId || !form.fecha) {
      return alert("Por favor completa los campos obligatorios");
    }

    setGuardando(true);
    try {
      await addDoc(collection(db, "appointments"), {
        ...form,
        userId: user.uid,
        creadoEn: new Date().toISOString()
      });
      navigate("/agenda");
    } catch (err) {
      alert("Error al agendar: " + err.message);
    }
    setGuardando(false);
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.btnVolver} onClick={() => navigate(-1)}>← Volver</button>
          <h2 style={styles.titulo}>Nueva Cita</h2>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Paciente *</label>
          <select style={styles.input} name="pacienteId" value={form.pacienteId} onChange={handleChange}>
            <option value="">Seleccionar paciente...</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>

          <label style={styles.label}>Centro de trabajo *</label>
          <select style={styles.input} name="workplaceId" value={form.workplaceId} onChange={handleChange}>
            <option value="">¿Dónde será la atención?</option>
            {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Fecha</label>
              <input style={styles.input} type="date" name="fecha" value={form.fecha} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Hora</label>
              <input style={styles.input} type="time" name="hora" value={form.hora} onChange={handleChange} />
            </div>
          </div>

          <label style={styles.label}>Motivo / Nota rápida</label>
          <input style={styles.input} name="motivo" value={form.motivo} onChange={handleChange} placeholder="Ej: Evaluación inicial" />

          <button style={styles.btnGuardar} onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Agendando..." : "Confirmar Cita"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "1.5rem", maxWidth: "500px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  titulo: { fontSize: "1.5rem", color: "#1e293b", margin: 0 },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.8rem", background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
  label: { fontWeight: "600", color: "#475569", fontSize: "0.85rem" },
  input: { padding: "0.7rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", color: "#1e293b", background: "white" }, // <- Forcé color negro y fondo blanco para arreglar el bug visual de tu captura
  row: { display: "flex", gap: "1rem" },
  btnGuardar: { marginTop: "1rem", padding: "0.8rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", fontWeight: "600", cursor: "pointer" }
};