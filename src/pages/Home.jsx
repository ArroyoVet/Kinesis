import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
// 1. Importamos las funciones de Firebase
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/config"; // Asegúrate de que esta ruta a tu config sea correcta

export default function Home() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // 2. Estados para manejar los lugares y el pequeño formulario
  const [lugares, setLugares] = useState([]);
  const [mostrandoInput, setMostrandoInput] = useState(false);
  const [nuevoLugar, setNuevoLugar] = useState("");

  // 3. Función para leer los lugares de este usuario
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

  // 4. Ejecutar la lectura al cargar la página
  useEffect(() => {
    obtenerLugares();
  }, [user]);

  // 5. Función para guardar el nuevo lugar
  const guardarLugar = async () => {
    if (nuevoLugar.trim() === "") return; // Evitar guardar vacíos
    
    try {
      await addDoc(collection(db, "workplaces"), {
        nombre: nuevoLugar,
        userId: user.uid
      });
      setNuevoLugar(""); // Limpiamos el input
      setMostrandoInput(false); // Ocultamos el input
      obtenerLugares(); // Recargamos la lista para que aparezca el nuevo
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
        <p style={styles.info}>Rol: {role}</p>

        <div style={styles.grid}>
          {/* 6. Mapeamos los lugares que vienen de Firebase */}
          {lugares.map((lugar) => (
            <div 
              key={lugar.id} 
              style={styles.card} 
              // Pasamos el ID o el nombre en la URL para saber a qué agenda entrar
              onClick={() => navigate(`/agenda?workplace=${lugar.id}`)} 
            >
              <span style={styles.cardIcon}>🏥</span>
              <h3>{lugar.nombre}</h3>
              <p>Centro de trabajo</p>
            </div>
          ))}

          {/* 7. Lógica condicional: Mostrar botón O mostrar input */}
          {role !== "admin" && (
            !mostrandoInput ? (
              <div style={styles.cardAdd} onClick={() => setMostrandoInput(true)}>
                <span style={styles.cardIcon}>➕</span>
                <h3>Agregar lugar</h3>
                <p>Nuevo centro de trabajo</p>
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

const styles = {
  container: {
    padding: "1rem 1.25rem",
    maxWidth: "900px",
    margin: "0 auto",
  },
  welcome: {
    fontSize: "1.5rem",
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: "0.25rem",
  },
  info: {
    color: "#64748b",
    margin: "0.2rem 0",
    fontSize: "0.875rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "1rem",
    marginTop: "2rem",
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
    gap: "0.6rem",
  },
  cardAdd: {
    background: "white",
    borderRadius: "12px",
    padding: "1.25rem",
    border: "0.5px dashed #cbd5e1",
    cursor: "pointer",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.6rem",
    color: "#94a3b8",
  },
  cardIcon: {
    fontSize: "1.75rem",
  },
  cardNombre: {
    fontWeight: "500",
    fontSize: "0.95rem",
    color: "#1e293b",
  },
  cardDesc: {
    fontSize: "0.8rem",
    color: "#64748b",
  },
};