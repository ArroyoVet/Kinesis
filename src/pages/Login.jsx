import { useState } from "react";
import { auth, db } from "../firebase/config";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const provider = new GoogleAuthProvider();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleEmail(e) {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    setTimeout(() => navigate("/"), 500);
  } catch {
    setError("Correo o contraseña incorrectos");
  }
}

async function handleGoogle() {
  try {
    await signInWithPopup(auth, provider);
    setTimeout(() => navigate("/"), 500);
  } catch {
    setError("Error al iniciar con Google");
  }
}

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Kinesis</h1>
        <p style={styles.subtitle}>Gestión de pacientes</p>

        <form onSubmit={handleEmail} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">Ingresar</button>
        </form>

        <button style={styles.btnGoogle} onClick={handleGoogle}>
          Ingresar con Google
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },
  card: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    border: "0.5px solid #e2e8f0",
    width: "100%",
    maxWidth: "360px",
  },
  title: {
    margin: 0,
    color: "#185FA5",
    fontSize: "1.75rem",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "1.75rem",
    fontSize: "0.875rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
  },
  input: {
    padding: "0.65rem 0.85rem",
    borderRadius: "8px",
    border: "0.5px solid #e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
    background: "#f8fafc",
    color: "#1e293b",
  },
  btn: {
    padding: "0.7rem",
    borderRadius: "8px",
    background: "#185FA5",
    color: "white",
    border: "none",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  btnGoogle: {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.7rem",
    borderRadius: "8px",
    background: "white",
    border: "0.5px solid #e2e8f0",
    fontSize: "0.95rem",
    cursor: "pointer",
    color: "#374151",
  },
  error: {
    color: "#A32D2D",
    fontSize: "0.825rem",
    textAlign: "center",
  },
};