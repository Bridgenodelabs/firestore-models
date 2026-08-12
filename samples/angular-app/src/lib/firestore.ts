import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  getFirestore,
  type CollectionReference,
  type Firestore,
} from "firebase/firestore";

import { environment } from "../environments/environment";

const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"] as const;

const missingKeys = requiredKeys.filter(
  (key) => environment.firebase[key].trim().length === 0,
);

/**
 * Non-null when the environment file is incomplete. The root component renders
 * this instead of the task UI rather than letting the Firebase SDK throw at an
 * arbitrary point later.
 */
export const firebaseConfigError: string | null =
  missingKeys.length > 0
    ? `Missing Firebase config values: ${missingKeys.join(", ")}`
    : null;

const firebaseApp =
  firebaseConfigError === null ? initializeApp(environment.firebase) : null;

export const db: Firestore | null =
  firebaseApp === null ? null : getFirestore(firebaseApp);

if (db !== null && environment.useEmulator) {
  connectFirestoreEmulator(db, environment.emulator.host, environment.emulator.port);
}

export const tasksCollection: CollectionReference | null =
  db === null ? null : collection(db, "tasks");
