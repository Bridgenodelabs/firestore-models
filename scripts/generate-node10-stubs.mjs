/**
 * Generate node10 subpath resolution stubs.
 *
 * `moduleResolution: node10` ignores the `exports` map entirely, so a consumer
 * asking for `@bridgenodelabs/firestore-models/core` resolves it the old way:
 * look for `core.js`, then `core/index.js`, then `core/package.json`'s `main`.
 * `typesVersions` covers the *types* half of that for TypeScript, but nothing
 * covers the runtime half — hence a real directory with a real package.json per
 * subpath, pointing back into dist.
 *
 * Generated at build time (never hand-edited, never committed) and shipped via
 * the `files` allowlist.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { SUBPATHS } from "./subpaths.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const missing = [];
const written = [];

for (const subpath of SUBPATHS) {
  const depth = subpath.split("/").length;
  const upToRoot = "../".repeat(depth);

  const targets = {
    main: `${upToRoot}dist/${subpath}/index.js`,
    module: `${upToRoot}dist/${subpath}/index.mjs`,
    types: `${upToRoot}dist/${subpath}/index.d.ts`,
  };

  const stubDirectory = join(repoRoot, subpath);

  for (const target of Object.values(targets)) {
    if (!existsSync(resolve(stubDirectory, target))) {
      missing.push(`${subpath} -> ${target}`);
    }
  }

  mkdirSync(stubDirectory, { recursive: true });
  writeFileSync(
    join(stubDirectory, "package.json"),
    `${JSON.stringify({ ...targets, sideEffects: false }, null, 2)}\n`,
    "utf8",
  );
  written.push(`${subpath}/package.json`);
}

if (missing.length > 0) {
  console.error("node10 stubs reference build output that does not exist:");
  for (const entry of missing) {
    console.error(`- ${entry}`);
  }
  console.error("\nDid the tsup build emit both cjs and esm formats plus declarations?");
  process.exit(1);
}

console.log("Generated node10 subpath stubs:");
for (const entry of written) {
  console.log(`- ${entry}`);
}
