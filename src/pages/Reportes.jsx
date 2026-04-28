import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#2563eb", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function Reportes() {
  const { user } = useAuth();
  const [datosCarga, setDatosCarga] = useState([]);
  const [datosDiagnostico, setDatosDiagnostico] = useState([]);
  const [stats, setStats] = useState({ enCurso: 0, altas: 0, totalSesiones: 0, promedioMejora: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarReportes() {
      if (!user) return;
      try {
        // 1. Pacientes
        const snapPacientes = await getDocs(
          query(collection(db, "patients"), where("userId", "==", user.uid))
        );
        const pacientes = snapPacientes.docs.map(d => d.data());

        // Diagnósticos
        const conteoDiag = {};
        pacientes.forEach(p => {
          const diag = p.motivoConsulta || "Sin especificar";
          conteoDiag[diag] = (conteoDiag[diag] || 0) + 1;
        });
        setDatosDiagnostico(Object.keys(conteoDiag).map(k => ({ name: k, value: conteoDiag[k] })));

        // 2. Sesiones via collectionGroup
        const snapSesiones = await getDocs(
          query(collectionGroup(db, "sessions"), where("userId", "==", user.uid))
        );
        const sesiones = snapSesiones.docs.map(d => d.data());

        // Carga por mes del año actual
        const year = new Date().getFullYear();
        const conteoPorMes = Array(12).fill(0);
        sesiones.forEach(s => {
          if (!s.fecha) return;
          const [y, m] = s.fecha.split("-").map(Number);
          if (y === year) conteoPorMes[m - 1]++;
        });
        setDatosCarga(MESES.map((mes, i) => ({ name: mes, sesiones: conteoPorMes[i] })));

        // Promedio mejora
        const conMejora = sesiones.filter(s => s.mejoraRespecto === "Sí").length;
        const promedioMejora = sesiones.length > 0
          ? Math.round((conMejora / sesiones.length) * 100)
          : 0;

        setStats({
          enCurso: pacientes.filter(p => p.estado === "en curso").length,
          altas: pacientes.filter(p => p.estado === "alta").length,
          totalSesiones: sesiones.length,
          promedioMejora,
        });

      } catch (error) {
        console.error("Error:", error);
      }
      setLoading(false);
    }
    cargarReportes();
  }, [user]);

  if (loading) return <div style={styles.loading}>Analizando datos...</div>;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.titulo}>Panel de Reportes</h2>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Pacientes en curso</span>
            <span style={styles.statNum}>{stats.enCurso}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Altas totales</span>
            <span style={{ ...styles.statNum, color: "#22c55e" }}>{stats.altas}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Total sesiones</span>
            <span style={{ ...styles.statNum, color: "#8b5cf6" }}>{stats.totalSesiones}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Sesiones con mejora</span>
            <span style={{ ...styles.statNum, color: "#22c55e" }}>{stats.promedioMejora}%</span>
          </div>
        </div>

        <div style={styles.chartsGrid}>
          {/* Carga de trabajo */}
          <div style={styles.chartBox}>
            <h3 style={styles.chartTitulo}>Sesiones por mes {new Date().getFullYear()}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={datosCarga}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="sesiones" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Diagnósticos */}
          <div style={styles.chartBox}>
            <h3 style={styles.chartTitulo}>Pacientes por diagnóstico</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={datosDiagnostico}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {datosDiagnostico.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "0.75rem 1rem", maxWidth: "1100px", margin: "0 auto" },
  titulo: { fontSize: "1.75rem", color: "#1e293b", marginBottom: "1.5rem" },
  loading: { textAlign: "center", padding: "3rem", color: "#64748b" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  statCard: { background: "white", padding: "1.25rem", borderRadius: "1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "0.5rem" },
  statLabel: { color: "#64748b", fontSize: "0.82rem", fontWeight: "600", textTransform: "uppercase" },
  statNum: { fontSize: "2rem", fontWeight: "700", color: "#2563eb" },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" },
  chartBox: { background: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
  chartTitulo: { fontSize: "1rem", color: "#1e293b", marginBottom: "1rem", fontWeight: "600" },
};