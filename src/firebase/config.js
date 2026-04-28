import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBdUTpyuBw0rgiXRZDVJ-eY9oIG_kuXBsM",
  authDomain: "physiotrack-cb5e2.firebaseapp.com",
  projectId: "physiotrack-cb5e2",
  storageBucket: "physiotrack-cb5e2.firebasestorage.app",
  messagingSenderId: "480217452843",
  appId: "1:480217452843:web:8b659e8cdfdf7504b0756e",
  measurementId: "G-R68ZW07L0V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);