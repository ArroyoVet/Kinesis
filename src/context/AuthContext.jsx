import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("Firebase user:", firebaseUser?.uid);
        if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        console.log("Buscando doc:", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        console.log("Doc exists:", docSnap.exists());
        console.log("Doc data:", docSnap.data());
        if (docSnap.exists()) {
            setRole(docSnap.data().role);
        }
        setUser(firebaseUser);
        } else {
        setUser(null);
        setRole(null);
        }
        setLoading(false);
    });
    return () => unsub();
}, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}