/**
 * Packaging fixture harness.
 *
 * Packs the repo with `npm pack`, then installs that tarball into a throwaway
 * directory per fixture and runs the fixture's `verify` script. Exit code 0 from
 * every fixture is the pass condition.
 *
 * Installing the *tarball* is the whole point. A workspace link, a `file:..`
 * dependency, or a test that imports `src` all bypass the `exports` map and the
 * `files` allowlist — the two things that were actually broken in 0.2.0. Those
 * setups pass against a broken package.
 *
 * Usage:
 *   node scripts/verify-packaging.mjs                # all fixtures
 *   node scripts/verify-packaging.mjs ts-node10-cjs  # one fixture
 *   node scripts/verify-packaging.mjs --keep         # leave temp dirs for debugging
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SUBPATHS } from "./subpaths.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturesRoot = join(repoRoot, "test", "packaging", "fixtures");

const args = process.argv.slice(2);
const keepTempDirs = args.includes("--keep");
const requestedFixtures = args.filter((arg) => !arg.startsWith("--"));

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, {
    stdio: "inherit",
    encoding: "utf8",
    ...options,
  });
}

/* -------------------------------------------------------------------------- */
/* Preconditions                                                              */
/* -------------------------------------------------------------------------- */

const buildOutputs = [
  join(repoRoot, "dist", "index.js"),
  join(repoRoot, "dist", "index.mjs"),
  join(repoRoot, "dist", "index.d.ts"),
  join(repoRoot, "dist", "index.d.mts"),
  ...SUBPATHS.map((subpath) => join(repoRoot, subpath, "package.json")),
];

const missingOutputs = buildOutputs.filter((file) => !existsSync(file));
if (missingOutputs.length > 0) {
  console.error("Build output is missing or stale. Run `pnpm run build` first.\n");
  for (const file of missingOutputs) {
    console.error(`- ${file.slice(repoRoot.length + 1)}`);
  }
  process.exit(1);
}

if (!existsSync(fixturesRoot)) {
  console.error(`No fixtures directory at ${fixturesRoot}`);
  process.exit(1);
}

const allFixtures = readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const fixtures =
  requestedFixtures.length > 0
    ? allFixtures.filter((name) => requestedFixtures.includes(name))
    : allFixtures;

const unknownFixtures = requestedFixtures.filter((name) => !allFixtures.includes(name));
if (unknownFixtures.length > 0) {
  console.error(`Unknown fixture(s): ${unknownFixtures.join(", ")}`);
  console.error(`Available: ${allFixtures.join(", ")}`);
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* Pack                                                                        */
/* -------------------------------------------------------------------------- */

const workspace = mkdtempSync(join(tmpdir(), "firestore-models-packaging-"));
const npmCache = join(workspace, "npm-cache");
const packDestination = join(workspace, "tarball");

const npmEnv = { ...process.env, npm_config_cache: npmCache, npm_config_audit: "false", npm_config_fund: "false" };

mkdirSync(packDestination, { recursive: true });

console.log("Packing tarball...");
const packOutput = execFileSync(
  npm,
  ["pack", "--json", "--ignore-scripts", "--pack-destination", packDestination],
  { cwd: repoRoot, encoding: "utf8", env: npmEnv, stdio: ["ignore", "pipe", "inherit"] },
);

const [packResult] = JSON.parse(packOutput);
const tarball = join(packDestination, packResult.filename);
console.log(`Packed ${packResult.filename} (${packResult.files.length} files)\n`);

/* -------------------------------------------------------------------------- */
/* Run fixtures                                                                */
/* -------------------------------------------------------------------------- */

const results = [];

for (const fixture of fixtures) {
  const fixtureWorkDir = join(workspace, "fixtures", fixture);
  console.log(`${"=".repeat(72)}\n▶ ${fixture}\n${"=".repeat(72)}`);

  let status = "pass";
  let failure;

  try {
    cpSync(join(fixturesRoot, fixture), fixtureWorkDir, { recursive: true });

    // Installs the fixture's own declared devDependencies *and* the packed
    // tarball in one pass. The tarball is extracted, not linked.
    run(npm, ["install", "--no-audit", "--no-fund", "--loglevel=error", tarball], {
      cwd: fixtureWorkDir,
      env: npmEnv,
    });

    run(npm, ["run", "--silent", "verify"], { cwd: fixtureWorkDir, env: npmEnv });
    console.log(`\n✔ ${fixture} passed\n`);
  } catch (error) {
    status = "fail";
    failure = error;
    console.error(`\n✖ ${fixture} FAILED (see output above)`);
    console.error(`  work dir: ${fixtureWorkDir}\n`);
  }

  results.push({ fixture, status, failure });
}

/* -------------------------------------------------------------------------- */
/* Report                                                                      */
/* -------------------------------------------------------------------------- */

const failed = results.filter((result) => result.status === "fail");

console.log("=".repeat(72));
console.log("Packaging fixture results");
console.log("=".repeat(72));
for (const { fixture, status } of results) {
  console.log(`${status === "pass" ? "✔ pass" : "✖ FAIL"}  ${fixture}`);
}
console.log("");

if (keepTempDirs || failed.length > 0) {
  console.log(`Temp workspace retained at: ${workspace}`);
} else {
  rmSync(workspace, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.error(`${failed.length} of ${results.length} packaging fixtures failed.`);
  process.exit(1);
}

console.log(`All ${results.length} packaging fixtures passed against the packed tarball.`);
