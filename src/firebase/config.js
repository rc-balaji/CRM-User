import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3AjgHywwV--TpcIVOBhBSXk0_DDMf8d4",
  authDomain: "crm-project-f7c2c.firebaseapp.com",
  projectId: "crm-project-f7c2c",
  storageBucket: "crm-project-f7c2c.firebasestorage.app",
  messagingSenderId: "686470505901",
  appId: "1:686470505901:web:e48e4b3788ebc0c2d0ad24",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
