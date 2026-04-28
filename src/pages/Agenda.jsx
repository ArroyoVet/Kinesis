import { useState } from "react";
import Navbar from "../components/Navbar";
import VistaSemanal from "../components/VistaSemanal";
import VistaMensual from "../components/VistaMensual";
import VistaAnual from "../components/VistaAnual";


export default function Agenda() {
  const [vista, setVista] = useState("semana");
  const [fecha, setFecha] = useState(new Date());

  function avanzar() {
    const nueva = new Date(fecha);
    if (vista === "semana") nueva.setDate(nueva.getDate() + 7);
    else if (vista === "mes") nueva.setMonth(nueva.getMonth() + 1);
    else nueva.setFullYear(nueva.getFullYear() + 1);
    setFecha(nueva);
  }

  function retroceder() {
    const nueva = new Date(fecha);
    if (vista === "semana") nueva.setDate(nueva.getDate() - 7);
    else if (vista === "mes") nueva.setMonth(nueva.getMonth() - 1);
    else nueva.setFullYear(nueva.getFullYear() - 1);
    setFecha(nueva);
  }

  function labelFecha() {
  if (vista === "semana") {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const mesLunes = lunes.toLocaleString("es-PE", { month: "short" });
    const mesDomingo = domingo.toLocaleString("es-PE", { month: "short" });

    if (mesLunes !== mesDomingo) {
      return `${lunes.getDate()} de ${mesLunes} - ${domingo.getDate()} de ${mesDomingo} ${domingo.getFullYear()}`;
    }
    return `${lunes.getDate()} al ${domingo.getDate()} de ${domingo.toLocaleString("es-PE", { month: "long" })} ${domingo.getFullYear()}`;
  }
  if (vista === "mes") return fecha.toLocaleString("es-PE", { month: "long", year: "numeric" });
  return fecha.getFullYear().toString();
}

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.vistas}>
            {["semana", "mes", "año"].map(v => (
              <button
                key={v}
                onClick={() => setVista(v)}
                style={{
                  ...styles.vistaBtn,
                  background: vista === v ? "#2563eb" : "white",
                  color: vista === v ? "white" : "#374151",
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div style={styles.navegacion}>
                <button onClick={retroceder} style={styles.navBtn}>◀</button>
                <div style={styles.contenedorFecha}>
                    <span style={styles.labelFecha}>{labelFecha()}</span>
                </div>
            <button onClick={avanzar} style={styles.navBtn}>▶</button>
                <button onClick={() => setFecha(new Date())} style={styles.hoyBtn}>Hoy</button>
                </div>
        </div>

        {vista === "semana" && <VistaSemanal fecha={fecha} />}
        {vista === "mes" && <VistaMensual fecha={fecha} />}
        {vista === "año" && <VistaAnual fecha={fecha} onMesClick={(mes) => { setFecha(mes); setVista("mes"); }} />}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "0.75rem 1rem", maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" },
  vistas: { display: "flex", gap: "0.5rem" },
  vistaBtn: {
    padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
    border: "1px solid #e2e8f0", cursor: "pointer", fontWeight: "500",
  },
  navegacion: { 
  display: "flex", 
  alignItems: "center", 
  gap: "0.75rem", 
  marginBottom: "1.5rem",
  justifyContent: "flex-start" // Mantiene el bloque a la izquierda
},
  hoyBtn: {
    padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
    border: "1px solid #2563eb", background: "white",
    color: "#2563eb", cursor: "pointer", fontWeight: "500",
  },
  contenedorFecha: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "300px", // Ancho fijo suficiente para "29 de Jun - 5 de Jul 2026"
  textAlign: "center"
},
labelFecha: { 
  fontWeight: "600", 
  color: "#1e293b", 
  fontSize: "1rem",
  width: "100%" 
},
  mesCard: {
    background: "white", borderRadius: "0.75rem", padding: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)", cursor: "pointer", textAlign: "center",
    border: "1px solid #e2e8f0",
  },
  mesNombre: { margin: 0, textTransform: "capitalize", color: "#1e293b" },
  mesSesiones: { color: "#94a3b8", fontSize: "0.85rem", margin: "0.5rem 0 0" },
};