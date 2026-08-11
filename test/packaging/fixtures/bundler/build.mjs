/**
 * A real bundle, not a type-only check.
 *
 * esbuild resolves the package through the `exports` map using bundler
 * conditions, so this is the path an Nx/Vite/Cloud Functions build takes. Both
 * output formats are produced because a bundler may target either, and each
 * pulls a different half of the `exports` map.
 */
import { build } from "esbuild";

const shared = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  logLevel: "warning",
};

await build({ ...shared, format: "esm", outfile: "dist/bundle.mjs" });
await build({ ...shared, format: "cjs", outfile: "dist/bundle.cjs" });

console.log("bundler: esbuild produced dist/bundle.mjs and dist/bundle.cjs");
