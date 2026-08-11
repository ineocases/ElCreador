// js/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBPmDeyflAieOkWMo5M4omBRSb8D7dqW90",
  authDomain: "elviral.firebaseapp.com",
  projectId: "elviral",
  storageBucket: "elviral.firebasestorage.app",
  messagingSenderId: "363741155240",
  appId: "1:363741155240:web:e545179e101608cc1c179d",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
let UID = null;

// Login anónimo automático
auth.signInAnonymously()
  .then(cred => { UID = cred.user.uid; })
  .catch(e => console.error("Error login:", e));
