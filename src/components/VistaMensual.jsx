import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function VistaMensual({ fecha }) {
  const [citas, setCitas] = useState([]);

  const year = fecha.getFullYear();
  const month = fecha.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  useEffect(() => {
    async function cargarCitas() {
      const inicio = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const fin = `${year}-${String(month + 1).padStart(2, "0")}-${String(ultimoDia.getDate()).padStart(2, "0")}`;
      const q = query(
        collection(db, "appointments"),
        where("fecha", ">=", inicio),
        where("fecha", "<=", fin)
      );
      const snap = await getDocs(q);
      setCitas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    cargarCitas();
  }, [fecha]);

  function getCitasDelDia(dia) {
    const fechaStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return citas.filter(c => c.fecha === fechaStr);
  }

  // Construir grilla
  const diasEnMes = ultimoDia.getDate();
  const inicioSemana = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
  const celdas = Array.from({ length: inicioSemana }, () => null)
    .concat(Array.from({ length: diasEnMes }, (_, i) => i + 1));

  return (
    <div style={styles.container}>
      {/* Header días */}
      <div style={styles.headerRow}>
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
          <div key={d} style={styles.headerCell}>{d}</div>
        ))}
      </div>

      {/* Grilla días */}
      <div style={styles.grilla}>
        {celdas.map((dia, i) => {
          const citasDia = dia ? getCitasDelDia(dia) : [];
          const esHoy = dia && new Date().getDate() === dia &&
            new Date().getMonth() === month && new Date().getFullYear() === year;
          return (
            <div key={i} style={{ ...styles.celda, background: dia ? "white" : "#f8fafc" }}>
              {dia && (
                <>
                  <span style={{ ...styles.numeroDia, background: esHoy ? "#2563eb" : "transparent", color: esHoy ? "white" : "#1e293b" }}>
                    {dia}
                  </span>
                  <div style={styles.citasContainer}>
                    {citasDia.map(cita => (
                      <div key={cita.id} style={{ ...styles.citaChip, background: cita.color || "#2563eb" }}>
                        {cita.pacienteNombre}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",          // Ocupa todo el ancho disponible
    display: "flex",         // Cambiamos grid por flex para el contenedor principal
    flexDirection: "column", // Header arriba, grilla abajo
    background: "white",
    borderRadius: "0.75rem", // Mantenemos tus bordes
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)", // Las 7 columnas de texto (LUN-DOM)
    borderBottom: "2px solid #e2e8f0",
    background: "#f8fafc",
    width: "100%",
  },
  headerCell: { // Asegúrate de tener este estilo para el texto de los días
    padding: "0.75rem",
    textAlign: "center",
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#64748b",
  },
  grilla: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)", // Las 7 columnas de celdas
    width: "100%",
    background: "white",
  },
  celda: {
    minHeight: "100px",
    borderRight: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    padding: "0.5rem",
    boxSizing: "border-box", // Importante para que el padding no sume ancho
  },
  numeroDia: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    fontSize: "0.85rem",
    fontWeight: "600",
    marginBottom: "0.25rem",
  },
  citasContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  citaChip: {
    borderRadius: "0.3rem",
    padding: "0.15rem 0.4rem",
    fontSize: "0.72rem",
    color: "white",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
  },
};