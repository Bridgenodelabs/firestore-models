/**
 * Single source of truth for the package's public subpath entrypoints.
 *
 * Consumed by:
 *   - scripts/generate-node10-stubs.mjs  (writes the node10 resolution stubs)
 *   - scripts/clean-build-output.mjs     (removes them on rebuild)
 *   - scripts/verify-package-contents.mjs (allowlists them in the tarball)
 *
 * The root entrypoint (".") is deliberately absent: node10 resolves it through
 * `main`/`types`, which need no stub.
 */
export const SUBPATHS = [
  "core",
  "time",
  "adapters/firebase-client",
  "adapters/firebase-admin",
  "react",
];

/**
 * Top-level directories created by the stub generator. `adapters/*` subpaths
 * are nested, so the directory that must be cleaned and shipped is `adapters`.
 */
export const STUB_ROOT_DIRECTORIES = [
  ...new Set(SUBPATHS.map((subpath) => subpath.split("/")[0])),
];
