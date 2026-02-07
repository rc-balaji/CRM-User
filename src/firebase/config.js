import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDklaku_vCOpDBm6wicnCMD7K3Udrjt6Bo",
  authDomain: "canteen-118b3.firebaseapp.com",
  projectId: "canteen-118b3",
  storageBucket: "canteen-118b3.firebasestorage.app",
  messagingSenderId: "966778135747",
  appId: "1:966778135747:web:2b2b3e425929f082d0ee76",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
