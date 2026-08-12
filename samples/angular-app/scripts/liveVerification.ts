/**
 * Live verification against the Firestore emulator.
 *
 * Mirrors samples/web-app/scripts/liveVerification.ts, with one difference:
 * configuration comes from src/environments/environment.ts rather than a
 * .env.local file, because that is how Angular apps carry build-time config.
 *
 * Exercises the same boundary the running app uses — `taskModel.toPersisted`
 * on the way in, `readDocumentDomain` on the way out, including
 * migration-on-read for a legacy schemaVersion 0 document.
 */
import { initializeApp } from "firebase/app";
import {
  Timestamp,
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { readDocumentDomain } from "@bridgenodelabs/firestore-models/adapters/firebase-client";

import { environment } from "../src/environments/environment";
import {
  taskModel,
  type Task,
  type TaskPersistedV0,
  type TaskPersistedV1,
} from "../src/models/task";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(message: string): void {
  console.log(`• ${message}`);
}

async function main(): Promise<void> {
  const projectId = process.env["FIREBASE_PROJECT_ID"] ?? environment.firebase.projectId;
  const emulatorHost = process.env["FIREBASE_EMULATOR_HOST"] ?? environment.emulator.host;
  const emulatorPort = Number(
    process.env["FIREBASE_EMULATOR_PORT"] ?? environment.emulator.port,
  );

  const app = initializeApp({ ...environment.firebase, projectId });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, emulatorHost, emulatorPort);

  const tasks = collection(db, "tasks");
  const runId = `verify-ng-${Date.now()}`;
  const createdDocIds: string[] = [];

  console.log(
    `Running live verification against ${emulatorHost}:${emulatorPort} (${projectId})`,
  );

  try {
    logStep("Creating a current-version task document");
    const domainTask: Task = {
      title: `${runId}-current`,
      done: false,
      dueAt: new Date("2030-01-02T03:04:00.000Z"),
      priority: "high",
    };

    const persistedTask = taskModel.toPersisted(domainTask, Timestamp.fromDate);
    const createdRef = await addDoc(tasks, persistedTask);
    createdDocIds.push(createdRef.id);

    const createdSnapshot = await getDoc(createdRef);
    assert(createdSnapshot.exists(), "Expected created task to exist");

    const createdRaw = createdSnapshot.data() as TaskPersistedV1;
    assert(createdRaw.schemaVersion === 1, "Expected schemaVersion 1 on created task");
    assert(createdRaw.done === false, "Expected created task done=false");
    assert(createdRaw.priority === "high", "Expected created task priority=high");
    assert(
      createdRaw.dueAt instanceof Timestamp,
      "Expected created task dueAt to be a Timestamp",
    );

    logStep("Reading the current document through readDocumentDomain");
    const hydratedCurrent = readDocumentDomain(createdSnapshot, taskModel);
    assert(
      hydratedCurrent.title === domainTask.title,
      "Expected current task title to round-trip",
    );
    assert(
      hydratedCurrent.done === domainTask.done,
      "Expected current task done to round-trip",
    );
    assert(
      hydratedCurrent.priority === domainTask.priority,
      "Expected current task priority to round-trip",
    );
    assert(
      hydratedCurrent.dueAt instanceof Date,
      "Expected current task dueAt to hydrate to Date",
    );

    logStep("Seeding a legacy schemaVersion 0 document");
    const legacyDocRef = doc(tasks, `${runId}-legacy`);
    const legacyRaw: TaskPersistedV0 = {
      schemaVersion: 0,
      title: `${runId}-legacy`,
      completed: true,
      dueDate: Timestamp.fromDate(new Date("2031-05-06T07:08:00.000Z")),
    };

    await setDoc(legacyDocRef, legacyRaw);
    createdDocIds.push(legacyDocRef.id);

    const legacySnapshot = await getDoc(legacyDocRef);
    assert(legacySnapshot.exists(), "Expected legacy task to exist");

    logStep("Verifying migration-on-read for the legacy document");
    const migratedLegacy = readDocumentDomain(legacySnapshot, taskModel);
    assert(
      migratedLegacy.title === legacyRaw.title,
      "Expected migrated legacy title to match",
    );
    assert(migratedLegacy.done === true, "Expected completed:true to migrate to done:true");
    assert(
      migratedLegacy.priority === "medium",
      "Expected legacy task to default to medium priority",
    );
    assert(
      migratedLegacy.dueAt instanceof Date,
      "Expected migrated legacy dueAt to hydrate to Date",
    );

    logStep("Toggling the current task done state");
    await updateDoc(createdRef, { done: true });
    const toggledSnapshot = await getDoc(createdRef);
    assert(toggledSnapshot.exists(), "Expected toggled task to exist");
    const toggledTask = readDocumentDomain(toggledSnapshot, taskModel);
    assert(toggledTask.done === true, "Expected toggled task done=true");

    logStep("Deleting verification documents");
    await Promise.all(createdDocIds.map((id) => deleteDoc(doc(tasks, id))));

    const deletedChecks = await Promise.all(
      createdDocIds.map((id) => getDoc(doc(tasks, id))),
    );
    for (const snapshot of deletedChecks) {
      assert(!snapshot.exists(), `Expected ${snapshot.id} to be deleted`);
    }

    console.log("Live verification passed.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Live verification failed: ${message}`);

    if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
      console.error(
        "Start the Firestore emulator first: firebase emulators:start --only firestore",
      );
    }

    process.exitCode = 1;
  }
}

void main();
