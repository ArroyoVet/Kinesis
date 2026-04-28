import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function VistaAnual({ fecha }) {
  const { user } = useAuth();
  const [conteos, setConteos] = useState({});
  const year = fecha.getFullYear();

  useEffect(() => {
    async function cargarConteosAnuales() {
      if (!user) return;
      // Consultamos todas las citas del año actual para este usuario
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", user.uid),
        where("fecha", ">=", `${year}-01-01`),
        where("fecha", "<=", `${year}-12-31`)
      );
      
      const snap = await getDocs(q);
      const data = {};
      
      snap.docs.forEach(doc => {
        const fechaCita = doc.data().fecha; // "2026-04-27"
        const mes = parseInt(fechaCita.split("-")[1]) - 1; // Obtiene el índice del mes (0-11)
        data[mes] = (data[mes] || 0) + 1;
      });
      
      setConteos(data);
    }
    cargarConteosAnuales();
  }, [year, user]);

  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div style={stylesAnual.grid}>
      {MESES.map((nombre, i) => (
        <div key={nombre} style={stylesAnual.card}>
          <div style={stylesAnual.mesHeader}>
            <span style={stylesAnual.mesNombre}>{nombre}</span>
            <span style={stylesAnual.yearBadge}>{year}</span>
          </div>
          <div style={stylesAnual.info}>
            <span style={stylesAnual.numero}>{conteos[i] || 0}</span>
            <span style={stylesAnual.label}>sesiones agendadas</span>
          </div>
          <div style={stylesAnual.barraCarga}>
            <div style={{
              ...stylesAnual.progreso,
              width: `${Math.min(((conteos[i] || 0) / 50) * 100, 100)}%`, // 50 sesiones como meta visual
              background: (conteos[i] || 0) > 0 ? "#2563eb" : "#e2e8f0"
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const stylesAnual = {
  grid: {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "0.75rem",
},
  card: {
  background: "white",
  borderRadius: "0.75rem",
  padding: "0.85rem 1rem",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  border: "1px solid #f1f5f9",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  cursor: "pointer",
},
  mesHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  mesNombre: { fontWeight: "700", color: "#1e293b", fontSize: "1rem" },
  yearBadge: { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600" },
  info: { display: "flex", alignItems: "baseline", gap: "0.5rem" },
  numero: { fontSize: "1.75rem", fontWeight: "800", color: "#2563eb" },
  label: { fontSize: "0.8rem", color: "#64748b" },
  barraCarga: { height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" },
  progreso: { height: "100%", transition: "width 0.5s ease-in-out" }
};