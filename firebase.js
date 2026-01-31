/*****************************************************
 * QueueSmart – Firebase Initialization
 * Pure Frontend (Hackathon Friendly)
 *****************************************************/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================================================
   🔑 FIREBASE CONFIG (REPLACE WITH YOUR OWN)
   ===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBfT2sUaubBCW6LeRRMPjRlpAIJ3NNOo14",
  authDomain: "queuesmart2.firebaseapp.com",
  projectId: "queuesmart2",
  storageBucket: "queuesmart2.firebasestorage.app",
  messagingSenderId: "1044451014391",
  appId: "1:1044451014391:web:d2db8550b113aebf50c5f2",
  measurementId: "G-8N8WN2976H"
};

/* =====================================================
   INITIALIZE FIREBASE
   ===================================================== */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =====================================================
   COLLECTION HELPERS
   ===================================================== */

// Active queue per location
function queueCollection(locationId) {
  return collection(db, "queues", locationId, "users");
}

// Wait-time logs for ML
const waitTimeLogsRef = collection(db, "waitTimeLogs");

/* =====================================================
   EXPORTS
   ===================================================== */

export {
  db,

  // Firestore core
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,

  // App helpers
  queueCollection,
  waitTimeLogsRef
};
