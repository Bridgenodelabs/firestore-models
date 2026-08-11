/**
 * Plain ESM Node consumer.
 *
 * This path already worked in 0.2.0 — the point of this fixture is that it must
 * *keep* working now that CommonJS is the package default and ESM moved to the
 * `.mjs`/`.d.mts` extension pair.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { core, time, getDocumentData } from "@bridgenodelabs/firestore-models";
import * as rootNamespace from "@bridgenodelabs/firestore-models";
import {
  assertObject,
  createValidator,
  defineModel,
  readDomain,
} from "@bridgenodelabs/firestore-models/core";
import { dateFromTimestamp, timestampFromDate } from "@bridgenodelabs/firestore-models/time";
import { readDocumentDomain as readClientDomain } from "@bridgenodelabs/firestore-models/adapters/firebase-client";
import { readDocumentDomain as readAdminDomain } from "@bridgenodelabs/firestore-models/adapters/firebase-admin";

/* -------------------------------------------------------------------------- */
/* Shape                                                                       */
/* -------------------------------------------------------------------------- */

assert.deepEqual(
  Object.keys(rootNamespace).sort(),
  ["core", "getDocumentData", "time"],
  "root export surface must be byte-identical to 0.2.0",
);

assert.equal(typeof getDocumentData, "function");
assert.equal(typeof core.createValidator, "function");
assert.equal(typeof time.dateFromTimestamp, "function");
assert.equal(typeof createValidator, "function");
assert.equal(typeof defineModel, "function");
assert.equal(typeof readDomain, "function");
assert.equal(typeof assertObject, "function");
assert.equal(typeof dateFromTimestamp, "function");
assert.equal(typeof timestampFromDate, "function");
assert.equal(typeof readClientDomain, "function");
assert.equal(typeof readAdminDomain, "function");

// The react entry needs `react` and `firebase/firestore` at runtime, which this
// fixture does not install — assert that it resolves to the ESM artifact under
// the `import` condition without evaluating it.
const resolvedReact = import.meta.resolve("@bridgenodelabs/firestore-models/react");
assert.ok(
  resolvedReact.endsWith("index.mjs"),
  `/react must resolve to the ESM artifact under the import condition, got ${resolvedReact}`,
);

// Under the `import` condition the root must be the .mjs build, not the CJS one.
const resolvedRoot = import.meta.resolve("@bridgenodelabs/firestore-models");
assert.ok(
  resolvedRoot.endsWith("index.mjs"),
  `root must resolve to .mjs under the import condition, got ${resolvedRoot}`,
);

// ...and a require() from the same installed tree must reach the CJS build.
const require = createRequire(import.meta.url);
assert.ok(
  require.resolve("@bridgenodelabs/firestore-models").endsWith("index.js"),
  "root must resolve to .js under the require condition",
);

/* -------------------------------------------------------------------------- */
/* Behaviour                                                                   */
/* -------------------------------------------------------------------------- */

const model = defineModel({
  currentVersion: 2,
  toPersisted: (domain) => ({ schemaVersion: 2, label: domain.label }),
  fromPersisted: (persisted) => ({ label: persisted.label }),
  migrations: {
    1: (persisted) => ({ schemaVersion: 2, label: persisted.name }),
  },
});

// Round-trip at the current version.
assert.deepEqual(readDomain(model.toPersisted({ label: "hi" }), model), { label: "hi" });

// And a real migration from an older persisted document.
assert.deepEqual(readDomain({ schemaVersion: 1, name: "legacy" }, model), { label: "legacy" });

const assertLabelled = createValidator((value) => {
  assertObject(value);
  if (typeof value.label !== "string") {
    throw new Error("label must be a string");
  }
});
assertLabelled({ schemaVersion: 2, label: "ok" });
assert.throws(() => assertLabelled({ schemaVersion: 2 }), /label must be a string/);

console.log("esm-import: named imports from root and all subpaths resolve and run");
