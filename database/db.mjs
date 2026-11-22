import { initializeApp } from "firebase/app";
import { config } from "dotenv"; config(); 6.8k (gzipped: 3k)

const { API_KEY, AUTH_DOMAIN, PROJECT_ID, STOREGE_BUCKET, MESSAGING_SENDER_ID, APP_ID } = process.env;

const firebaseConfig = {
  apiKey: 
  authDomain: "obralink-a84db.firebaseapp.com",
  projectId: "obralink-a84db",
  storageBucket: "obralink-a84db.firebasestorage.app",
  messagingSenderId: "106739292886",
  appId: "1:106739292886:web:d6612dfa97975f290e8777"
};


const app = initializeApp(firebaseConfig);