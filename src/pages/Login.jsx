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
    background: "#f0f4f8",
  },
  card: {
    background: "white",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "380px",
  },
  title: {
    margin: 0,
    color: "#2563eb",
    fontSize: "2rem",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    outline: "none",
  },
  btn: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    background: "#2563eb",
    color: "white",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  btnGoogle: {
    marginTop: "1rem",
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    background: "white",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    cursor: "pointer",
    color: "#374151",
  },
  error: {
    color: "#ef4444",
    fontSize: "0.875rem",
    textAlign: "center",
  },
};