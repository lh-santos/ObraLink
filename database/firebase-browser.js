import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW6eNqsEKGfwthWHLSHo2L1GWZB3l-jfY",
  authDomain: "obralink-a84db.firebaseapp.com",
  databaseURL: "https://obralink-a84db-default-rtdb.firebaseio.com",
  projectId: "obralink-a84db",
  storageBucket: "obralink-a84db.firebasestorage.app",
  messagingSenderId: "106739292886",
  appId: "1:106739292886:web:d6612dfa97975f290e8777"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);


