import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import { GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {

  apiKey: "AIzaSyCtEXGaZtT2VmbwzDepQTlm9XP_a6ACiO8",

  authDomain: "elcreador-e5e33.firebaseapp.com",

  projectId: "elcreador-e5e33",

  storageBucket: "elcreador-e5e33.firebasestorage.app",

  messagingSenderId: "998895983011",

  appId: "1:998895983011:web:24c637ad1c972bff206216",

  measurementId: "G-LDRBZ1WMGF"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();
