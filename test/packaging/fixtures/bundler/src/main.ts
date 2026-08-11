import assert from "node:assert/strict";

import { createValidator, defineModel, readDomain } from "@bridgenodelabs/firestore-models/core";
import type { ModelSpec, PersistedBase } from "@bridgenodelabs/firestore-models/core";
import { getDocumentData } from "@bridgenodelabs/firestore-models";
import { dateFromTimestamp } from "@bridgenodelabs/firestore-models/time";
import { toTypedSnapshot } from "@bridgenodelabs/firestore-models/adapters/firebase-client";

interface Task {
  title: string;
  done: boolean;
}

interface PersistedTaskV1 extends PersistedBase {
  schemaVersion: 1;
  title: string;
}

interface PersistedTaskV2 extends PersistedBase {
  schemaVersion: 2;
  title: string;
  done: boolean;
}

const taskModel: ModelSpec<Task, PersistedTaskV2> = defineModel<Task, PersistedTaskV2>({
  currentVersion: 2,
  toPersisted: (domain) => ({ schemaVersion: 2, title: domain.title, done: domain.done }),
  fromPersisted: (persisted) => ({ title: persisted.title, done: persisted.done }),
  migrations: {
    1: (persisted: PersistedTaskV1): PersistedTaskV2 => ({
      schemaVersion: 2,
      title: persisted.title,
      done: false,
    }),
  },
});

assert.equal(typeof createValidator, "function");
assert.equal(typeof getDocumentData, "function");
assert.equal(typeof dateFromTimestamp, "function");

const snapshot = toTypedSnapshot({
  id: "task-1",
  exists: () => true,
  data: () => ({ schemaVersion: 2, title: "ship 0.2.1", done: true }),
});
assert.equal(snapshot.id, "task-1");
assert.equal(snapshot.exists, true);

assert.deepEqual(readDomain(getDocumentData(snapshot), taskModel), {
  title: "ship 0.2.1",
  done: true,
});

// Migration path survives bundling.
assert.deepEqual(readDomain({ schemaVersion: 1, title: "legacy" }, taskModel), {
  title: "legacy",
  done: false,
});

console.log(`bundler: bundled output ran (${process.argv[1].endsWith(".cjs") ? "cjs" : "esm"})`);
