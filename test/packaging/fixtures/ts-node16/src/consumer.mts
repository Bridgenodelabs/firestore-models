/**
 * node16 resolution, ESM half.
 *
 * A `.mts` file is resolved and emitted as ESM, so TypeScript must pick the
 * `import` condition and get `.d.mts` types describing the `.mjs` artifact.
 */
import assert from "node:assert/strict";

import { createValidator, defineModel, readDomain } from "@bridgenodelabs/firestore-models/core";
import type { ModelSpec, PersistedBase } from "@bridgenodelabs/firestore-models/core";
import { getDocumentData } from "@bridgenodelabs/firestore-models";
import { dateFromTimestamp } from "@bridgenodelabs/firestore-models/time";
import { toTypedSnapshot } from "@bridgenodelabs/firestore-models/adapters/firebase-admin";

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
assert.equal(typeof dateFromTimestamp, "function");
assert.equal(typeof toTypedSnapshot, "function");

assert.deepEqual(readDomain(noteModel.toPersisted({ body: "hi" }), noteModel), { body: "hi" });

// This file is ESM, so the resolved artifact must be the .mjs build.
const resolved = import.meta.resolve("@bridgenodelabs/firestore-models/core");
assert.ok(
  resolved.endsWith("index.mjs"),
  `node16 + ESM must resolve /core to the .mjs artifact, got ${resolved}`,
);

console.log("ts-node16 (esm): types and runtime both resolve to the ESM build");
