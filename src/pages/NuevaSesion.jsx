import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, doc, updateDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext"; // <-- 1. Importamos el contexto

const TECNICAS = ["TENS", "CHC", "Masaje", "Pistola de masaje", "Ultrasonido", "Ejercicios", "Termoterapia", "Crioterapia", "Electroterapia", "Otro"];

export default function NuevaSesion() {
  const { id, epId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- 2. Obtenemos el usuario logueado

  const [numeroCita, setNumeroCita] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    hora: "08:00",
    asistio: true,
    motivoFalta: "",
    tecnicasAplicadas: [],
    equiposUsados: "",
    zonasTratadas: "",
    tiempoSesion: 45,
    dolorInicio: 5,
    dolorFin: 3,
    mejoraRespecto: "Sí",
    tareasCumplidas: "Sí",
    ejerciciosIndicados: "",
    ejerciciosEnCasa: "",
    observaciones: "",
  });

  useEffect(() => {
    async function contarSesiones() {
      const snap = await getDocs(
        query(collection(db, "patients", id, "episodes", epId, "sessions"), orderBy("fecha"))
      );
      setNumeroCita(snap.size + 1);
    }
    contarSesiones();
  }, [id, epId]); // Es buena práctica pasar estas dependencias aquí

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function toggleTecnica(tecnica) {
    const ya = form.tecnicasAplicadas.includes(tecnica);
    setForm({
      ...form,
      tecnicasAplicadas: ya
        ? form.tecnicasAplicadas.filter(t => t !== tecnica)
        : [...form.tecnicasAplicadas, tecnica],
    });
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      await addDoc(collection(db, "patients", id, "episodes", epId, "sessions"), {
        ...form,
        numeroCita,
        dolorInicio: Number(form.dolorInicio),
        dolorFin: Number(form.dolorFin),
        tiempoSesion: Number(form.tiempoSesion),
        creadoEn: new Date().toISOString(),
        userId: user.uid, // <-- 3. AQUÍ APLICAMOS LA PRIVACIDAD DE LA SESIÓN
      });
      await updateDoc(doc(db, "patients", id, "episodes", epId), {
        totalSesiones: numeroCita,
      });
      navigate(`/pacientes/${id}/episodios/${epId}`);
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
          <button style={styles.btnVolver} onClick={() => navigate(`/pacientes/${id}/episodios/${epId}`)}>← Volver</button>
          <h2 style={styles.titulo}>Sesión #{numeroCita}</h2>
        </div>

        <div style={styles.form}>
          {/* Fecha y hora */}
          <div style={styles.fila}>
            <div style={styles.campo}>
              <label style={styles.label}>Fecha</label>
              <input style={styles.input} type="date" name="fecha" value={form.fecha} onChange={handleChange} />
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>Hora</label>
              <input style={styles.input} type="time" name="hora" value={form.hora} onChange={handleChange} />
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>Duración (min)</label>
              <input style={styles.input} type="number" name="tiempoSesion" value={form.tiempoSesion} onChange={handleChange} />
            </div>
          </div>

          {/* Asistencia */}
          <label style={styles.label}>¿Asistió?</label>
          <div style={styles.fila}>
            {["true", "false"].map(v => (
              <button
                key={v}
                onClick={() => {
                    const valorDelBoton = v === "true"; 
                    setForm({ 
                    ...form, 
                    asistio: form.asistio === valorDelBoton ? null : valorDelBoton 
                    });
                }}
                style={{
                    ...styles.toggleBtn,
                    background: String(form.asistio) === v ? "#2563eb" : "white",
                    color: String(form.asistio) === v ? "white" : "#374151",
                }}
                >
                {v === "true" ? "✓ Sí asistió" : "✗ No asistió"}
                </button>
            ))}
          </div>

          {!form.asistio && (
            <>
              <label style={styles.label}>Motivo de falta</label>
              <input style={styles.input} name="motivoFalta" value={form.motivoFalta} onChange={handleChange} placeholder="Ej: viaje, enfermedad..." />
            </>
          )}

          {form.asistio && (
            <>
              {/* Dolor EVA */}
              <div style={styles.fila}>
                <div style={styles.campo}>
                  <label style={styles.label}>Dolor inicio (EVA 0-10)</label>
                  <input style={styles.input} type="number" min="0" max="10" name="dolorInicio" value={form.dolorInicio} onChange={handleChange} />
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Dolor fin (EVA 0-10)</label>
                  <input style={styles.input} type="number" min="0" max="10" name="dolorFin" value={form.dolorFin} onChange={handleChange} />
                </div>
              </div>

              {/* Mejora */}
              <label style={styles.label}>Mejora respecto a sesión anterior</label>
              <div style={styles.fila}>
                {["Sí", "Parcial", "No"].map(v => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, mejoraRespecto: v })}
                    style={{
                      ...styles.toggleBtn,
                      background: form.mejoraRespecto === v ? "#2563eb" : "white",
                      color: form.mejoraRespecto === v ? "white" : "#374151",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Tareas en casa */}
              <label style={styles.label}>Tareas en casa cumplidas</label>
              <div style={styles.fila}>
                {["Sí", "Parcial", "No"].map(v => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, tareasCumplidas: v })}
                    style={{
                      ...styles.toggleBtn,
                      background: form.tareasCumplidas === v ? "#2563eb" : "white",
                      color: form.tareasCumplidas === v ? "white" : "#374151",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Técnicas */}
              <label style={styles.label}>Técnicas aplicadas</label>
              <div style={styles.tecnicasGrid}>
                {TECNICAS.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTecnica(t)}
                    style={{
                      ...styles.tecnicaBtn,
                      background: form.tecnicasAplicadas.includes(t) ? "#2563eb" : "white",
                      color: form.tecnicasAplicadas.includes(t) ? "white" : "#374151",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Zona tratada */}
              <label style={styles.label}>Zona tratada</label>
              <input style={styles.input} name="zonasTratadas" value={form.zonasTratadas} onChange={handleChange} placeholder="Ej: Columna lumbar, glúteo" />

              {/* Ejercicios */}
              <label style={styles.label}>Ejercicios indicados en sesión</label>
              <textarea style={styles.textarea} name="ejerciciosIndicados" value={form.ejerciciosIndicados} onChange={handleChange} placeholder="Ej: Puente glúteo 3x15..." />

              <label style={styles.label}>Ejercicios en casa</label>
              <textarea style={styles.textarea} name="ejerciciosEnCasa" value={form.ejerciciosEnCasa} onChange={handleChange} placeholder="Ej: Estiramiento 2x/día..." />
            </>
          )}

          {/* Observaciones */}
          <label style={styles.label}>Observaciones</label>
          <textarea style={styles.textarea} name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Notas adicionales de la sesión..." />

          <button style={styles.btnGuardar} onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "0.75rem 1rem", maxWidth: "680px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  titulo: { fontSize: "1.5rem", color: "#1e293b", margin: 0 },
  btnVolver: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "1rem", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem", background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  label: { fontWeight: "600", color: "#374151", fontSize: "0.9rem", marginTop: "0.75rem" },
  input: { padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", outline: "none" },
  textarea: { padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "1rem", outline: "none", minHeight: "70px", resize: "vertical" },
  fila: { display: "flex", gap: "0.75rem", flexWrap: "wrap" },
  campo: { flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "120px" },
  toggleBtn: { flex: 1, padding: "0.6rem 1rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", cursor: "pointer", fontWeight: "500", minWidth: "80px" },
  tecnicasGrid: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  tecnicaBtn: { padding: "0.4rem 0.85rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.88rem", fontWeight: "500" },
  btnGuardar: { marginTop: "1rem", padding: "0.85rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", fontSize: "1rem", fontWeight: "600", cursor: "pointer" },
};