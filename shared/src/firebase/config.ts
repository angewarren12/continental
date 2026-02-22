import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDzz3qGP7bQWy95NnTter9azTeHMJC6UHM',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'continental-d2f6e.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'continental-d2f6e',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'continental-d2f6e.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '56233870813',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:56233870813:web:7587c7122a4030a73b6234',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4CS00Z22WN',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseDb = (): Firestore => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
};
