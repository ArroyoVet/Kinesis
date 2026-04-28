import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import BotonInstalar from "../components/BotonInstalar"; // <-- Importamos el nuevo componente
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Home() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [lugares, setLugares] = useState([]);
  const [mostrandoInput, setMostrandoInput] = useState(false);
  const [nuevoLugar, setNuevoLugar] = useState("");

  const obtenerLugares = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "workplaces"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const lugaresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLugares(lugaresData);
    } catch (error) {
      console.error("Error obteniendo lugares:", error);
    }
  };

  useEffect(() => {
    obtenerLugares();
  }, [user]);

  const guardarLugar = async () => {
    if (nuevoLugar.trim() === "") return;
    try {
      await addDoc(collection(db, "workplaces"), {
        nombre: nuevoLugar,
        userId: user.uid
      });
      setNuevoLugar("");
      setMostrandoInput(false);
      obtenerLugares();
    } catch (error) {
      console.error("Error al guardar el lugar:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.welcome}>Bienvenido/a 👋</h2>
        <p style={styles.info}>Usuario: {user?.email}</p>
        
        {/* BANNER DE INSTALACIÓN: Solo aparecerá en móviles compatibles */}
        <BotonInstalar />

        <div style={styles.grid}>
          {lugares.map((lugar) => (
            <div 
              key={lugar.id} 
              style={styles.card} 
              onClick={() => navigate(`/agenda?workplace=${lugar.id}`)} 
            >
              <span style={styles.cardIcon}>🏥</span>
              <h3 style={styles.cardNombre}>{lugar.nombre}</h3>
              <p style={styles.cardDesc}>Centro de trabajo</p>
            </div>
          ))}

          {role !== "admin" && (
            !mostrandoInput ? (
              <div style={styles.cardAdd} onClick={() => setMostrandoInput(true)}>
                <span style={styles.cardIcon}>➕</span>
                <h3 style={styles.cardNombre}>Agregar lugar</h3>
                <p style={styles.cardDesc}>Nuevo centro de trabajo</p>
              </div>
            ) : (
              <div style={styles.cardInputContainer}>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Nombre del lugar..."
                  value={nuevoLugar}
                  onChange={(e) => setNuevoLugar(e.target.value)}
                  style={styles.input}
                />
                <div style={styles.buttonGroup}>
                  <button style={styles.btnCancel} onClick={() => setMostrandoInput(false)}>Cancelar</button>
                  <button style={styles.btnSave} onClick={guardarLugar}>Guardar</button>
                </div>
              </div>
            ) 
          )}    
        </div>
      </div>
    </div>
  );
}

// Estilos actualizados para mejorar la consistencia visual
const styles = {
  container: { padding: "1rem 1.25rem", maxWidth: "900px", margin: "0 auto" },
  welcome: { fontSize: "1.5rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.25rem" },
  info: { color: "#64748b", margin: "0.2rem 0 1.5rem 0", fontSize: "0.875rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "1rem",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "1.25rem",
    border: "1.5px solid #185FA5",
    cursor: "pointer",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.4rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  cardAdd: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "1.25rem",
    border: "1.5px dashed #cbd5e1",
    cursor: "pointer",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.4rem",
    color: "#94a3b8",
  },
  cardIcon: { fontSize: "1.75rem" },
  cardNombre: { fontWeight: "600", fontSize: "0.95rem", color: "#1e293b", margin: 0 },
  cardDesc: { fontSize: "0.8rem", color: "#64748b", margin: 0 },
  cardInputContainer: { background: "white", borderRadius: "12px", padding: "1rem", border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: { padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.9rem" },
  buttonGroup: { display: "flex", gap: "0.5rem" },
  btnCancel: { flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "0.8rem" },
  btnSave: { flex: 1, padding: "0.5rem", borderRadius: "6px", border: "none", background: "#185FA5", color: "white", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" },
};