import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

function readFirebaseEnv(name: (typeof requiredEnvVars)[number]): string {
  return String(import.meta.env[name] ?? "").trim();
}

const missingRequiredEnvVars = requiredEnvVars.filter(
  (name) => readFirebaseEnv(name).length === 0,
);

export const firebaseConfigError: string | null =
  missingRequiredEnvVars.length > 0
    ? `Missing required environment variables: ${missingRequiredEnvVars.join(", ")}`
    : null;

const firebaseApp =
  firebaseConfigError === null
    ? initializeApp({
        apiKey: readFirebaseEnv("VITE_FIREBASE_API_KEY"),
        authDomain: readFirebaseEnv("VITE_FIREBASE_AUTH_DOMAIN"),
        projectId: readFirebaseEnv("VITE_FIREBASE_PROJECT_ID"),
        appId: readFirebaseEnv("VITE_FIREBASE_APP_ID"),
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      })
    : null;

export const db: Firestore | null =
  firebaseApp === null ? null : getFirestore(firebaseApp);

const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
const emulatorPort = Number(
  import.meta.env.VITE_FIREBASE_EMULATOR_PORT ?? 8080,
);
const shouldUseEmulator =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true" || import.meta.env.DEV;

let emulatorConnected = false;

if (shouldUseEmulator && !emulatorConnected) {
  if (db !== null) {
    connectFirestoreEmulator(db, emulatorHost, emulatorPort);
  }
  emulatorConnected = true;
}

export const tasksCollection = db === null ? null : collection(db, "tasks");
