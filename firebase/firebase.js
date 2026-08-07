// firebase/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // O la ruta general de firebase app
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tus credenciales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCtEXGaZtT2VmbwzDepQTlm9XP_a6ACiO8",
  authDomain: "elcreador-e5e33.firebaseapp.com",
  projectId: "elcreador-e5e33",
  storageBucket: "elcreador-e5e33.firebasestorage.app",
  messagingSenderId: "998895983011",
  appId: "1:998895983011:web:24c637ad1c972bff206216",
  measurementId: "G-LDRBZ1WMGF"
};

// Inicializar Firebase de forma segura
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🔥 Firebase conectado correctamente.");
} catch (error) {
    console.warn("⚠️ Firebase no se pudo inicializar (funcionando en modo local).", error);
}

export { db };
