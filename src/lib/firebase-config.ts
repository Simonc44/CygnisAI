
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration is now hardcoded for reliability
// This is public and safe.
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDoiAht75pOjjSAFVfPXq0l0J8pshSpJko",
  authDomain: "cygnis-91egx.firebaseapp.com",
  projectId: "cygnis-91egx",
  storageBucket: "cygnis-91egx.appspot.com",
  messagingSenderId: "545558560404",
  appId: "1:545558560404:web:7615fd384b61d6bca6be81",
  measurementId: "G-ZQE30E18BK"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

