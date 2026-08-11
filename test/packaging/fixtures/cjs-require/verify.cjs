/**
 * Plain CommonJS Node consumer. No TypeScript, no bundler, no transpiler.
 *
 * Against 0.2.0 this file could not get past line one: the exports map had no
 * `require` condition at all, so Node threw
 * ERR_PACKAGE_PATH_NOT_EXPORTED for the root and every subpath.
 */
const assert = require("node:assert/strict");

const PKG = "@bridgenodelabs/firestore-models";

/* -------------------------------------------------------------------------- */
/* Root                                                                        */
/* -------------------------------------------------------------------------- */

const root = require(PKG);

// The 0.2.0 consumer symptom, asserted directly: an ESM namespace transpiled at
// consume time collapses to a lone `default` key. A real CJS artifact does not.
assert.notDeepEqual(Object.keys(root), ["default"], "root collapsed to { default }");

assert.deepEqual(
  Object.keys(root).sort(),
  ["core", "getDocumentData", "time"],
  "root export surface must be byte-identical to 0.2.0",
);
assert.equal(typeof root.getDocumentData, "function");
assert.equal(typeof root.core.createValidator, "function");
assert.equal(typeof root.time.dateFromTimestamp, "function");

/* -------------------------------------------------------------------------- */
/* Subpaths                                                                    */
/* -------------------------------------------------------------------------- */

const core = require(`${PKG}/core`);

assert.notDeepEqual(Object.keys(core), ["default"], "/core collapsed to { default }");
assert.deepEqual(
  Object.keys(core).sort(),
  [
    "assertNumber",
    "assertObject",
    "assertSchemaVersion",
    "createValidator",
    "defineModel",
    "migratePersisted",
    "readDomain",
  ],
  "/core must expose real named exports",
);
assert.equal(typeof core.createValidator, "function");

const time = require(`${PKG}/time`);
assert.equal(typeof time.dateFromTimestamp, "function");
assert.equal(typeof time.timestampFromDate, "function");

const firebaseClient = require(`${PKG}/adapters/firebase-client`);
assert.equal(typeof firebaseClient.toTypedSnapshot, "function");
assert.equal(typeof firebaseClient.readDocumentDomain, "function");

const firebaseAdmin = require(`${PKG}/adapters/firebase-admin`);
assert.equal(typeof firebaseAdmin.toTypedSnapshot, "function");
assert.equal(typeof firebaseAdmin.readDocumentDomain, "function");

// The react entry pulls in `react` and `firebase/firestore` at runtime, which
// this fixture deliberately does not install. Resolution is the thing under
// test, so resolve it without executing it.
assert.ok(
  require.resolve(`${PKG}/react`).endsWith("index.js"),
  "/react must resolve to the CJS artifact under the require condition",
);

/* -------------------------------------------------------------------------- */
/* Behaviour, not just shape                                                   */
/* -------------------------------------------------------------------------- */

const model = core.defineModel({
  currentVersion: 1,
  toPersisted: (domain) => ({ schemaVersion: 1, label: domain.label }),
  fromPersisted: (persisted) => ({ label: persisted.label }),
});

const persisted = model.toPersisted({ label: "hello" });
assert.deepEqual(persisted, { schemaVersion: 1, label: "hello" });
assert.deepEqual(core.readDomain(persisted, model), { label: "hello" });

const assertLabelled = core.createValidator((value) => {
  core.assertObject(value);
  if (typeof value.label !== "string") {
    throw new Error("label must be a string");
  }
});
assertLabelled(persisted);
assert.throws(() => assertLabelled({ schemaVersion: 1 }), /label must be a string/);

console.log("cjs-require: root and all subpaths expose real named exports");
