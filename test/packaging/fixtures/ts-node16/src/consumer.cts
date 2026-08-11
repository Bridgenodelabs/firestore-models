/**
 * node16 resolution, CommonJS half.
 *
 * A `.cts` file is resolved and emitted as CommonJS, so TypeScript must pick the
 * `require` condition and get `.d.ts` types describing a CJS artifact. Against
 * 0.2.0 this reported ESM-masquerading-as-CJS: types resolved, but the runtime
 * artifact behind them was ESM and only reachable via dynamic import.
 */
import assert from "node:assert/strict";

import { createValidator, defineModel, readDomain } from "@bridgenodelabs/firestore-models/core";
import type { ModelSpec, PersistedBase } from "@bridgenodelabs/firestore-models/core";
import { getDocumentData } from "@bridgenodelabs/firestore-models";
import { timestampFromDate } from "@bridgenodelabs/firestore-models/time";
import { toTypedSnapshot } from "@bridgenodelabs/firestore-models/adapters/firebase-client";

interface Note {
  body: string;
}

interface PersistedNote extends PersistedBase {
  schemaVersion: 1;
  body: string;
}

const noteModel: ModelSpec<Note, PersistedNote> = defineModel<Note, PersistedNote>({
  currentVersion: 1,
  toPersisted: (domain) => ({ schemaVersion: 1, body: domain.body }),
  fromPersisted: (persisted) => ({ body: persisted.body }),
});

assert.equal(typeof createValidator, "function");
assert.equal(typeof getDocumentData, "function");
assert.equal(typeof timestampFromDate, "function");
assert.equal(typeof toTypedSnapshot, "function");

assert.deepEqual(readDomain(noteModel.toPersisted({ body: "hi" }), noteModel), { body: "hi" });

// This file is CommonJS, so the resolved artifact must be the CJS build.
assert.ok(
  require.resolve("@bridgenodelabs/firestore-models/core").endsWith("index.js"),
  "node16 + CJS must resolve /core to the .js artifact",
);

console.log("ts-node16 (cjs): types and runtime both resolve to the CommonJS build");
