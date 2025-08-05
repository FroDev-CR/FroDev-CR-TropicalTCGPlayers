// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // ✅ Importar storage

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "tropical-tcg-players-5a199.firebaseapp.com",
  projectId: "tropical-tcg-players-5a199",
  storageBucket: "tropical-tcg-players-5a199.appspot.com",
  messagingSenderId: "943837881919",
  appId: "1:943837881919:web:471ae207891d2f07837a8a",
  measurementId: "G-V4BRPDYE31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // ✅ Inicializar storage

export { db, auth, storage }; // ✅ Exportar también storage
