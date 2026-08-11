# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-08-11

Packaging and published metadata. **No public API change** — the exported
surface is identical to `0.2.0`, no runtime dependencies were added, and every
existing unit test passes unmodified. The one metadata change beyond packaging
is a narrowed `engines.node` floor, described under Changed.

### Fixed

- **The package is now consumable from a TypeScript CommonJS project using
  `moduleResolution: node10`.** `0.2.0` was ESM-only and exposed its subpaths
  solely through an `exports` map, which `node10` ignores entirely. A consumer
  importing `@bridgenodelabs/firestore-models/core` got `TS2307: Cannot find
  module`, and `require()` of the package root or any subpath threw
  `ERR_PACKAGE_PATH_NOT_EXPORTED` because no `require` condition existed.
- Types are no longer masquerading as the wrong module format. Each `exports`
  entry now lists `types` **first** within its condition object, where
  previously a `default`-before-`types` ordering meant TypeScript never saw the
  `types` entry. `publint --strict` reported seven errors against `0.2.0` and
  reports none now.

### Added

- Dual build. Every entrypoint emits CommonJS (`index.js`, `index.d.ts`) and ESM
  (`index.mjs`, `index.d.mts`).
- Generated node10 subpath resolution stubs (`core/`, `time/`,
  `adapters/firebase-client/`, `adapters/firebase-admin/`, `react/`), so `node10`
  resolves each subpath at runtime as well as at type level. Produced by
  `scripts/generate-node10-stubs.mjs` at build time; never committed.
- `typesVersions` mapping for all five subpaths, covering the type half of
  `node10` resolution.
- `module`, `sideEffects`, and `./package.json` export fields.
- Packaging fixture suite (`test/packaging/`) — five consumer projects that
  install the **packed tarball** and are verified to fail against `0.2.0`:
  `cjs-require`, `esm-import`, `ts-node10-cjs` (TypeScript + ts-jest, the
  release-blocking case), `ts-node16`, and `bundler` (real esbuild build).
  Run with `pnpm run test:packaging`.
- `publint --strict` and `@arethetypeswrong/cli --pack` as CI and prepublish
  gates.
- CI now runs the packaging fixtures on Node 22.22.3 (the declared
  `engines.node` floor), 22, and 24, plus Node 26 non-blocking.

### Changed

- `engines.node` is now `">=22.22.3"`, up from `">=22.0.0"`. This is the floor
  shared by the head of the Node 22 LTS line and Angular 22, whose own
  constraint is `^22.22.3 || ^24.15.0 || >=26.0.0` — raised now so a planned
  Angular sample under `samples/` does not sit in tension with the repository's
  declared support floor. `firebase-admin` 14's `>=22` was already satisfied.

  **Migration:** anyone on Node 22.0.0–22.22.2 will see an `EBADENGINE` warning
  on install. It is a warning, not an error, unless the consumer sets
  `engine-strict`. Node 22.22.3 shipped 2026-05-13; upgrading within the 22 LTS
  line resolves it. Nothing in the library's runtime requires it — the floor is
  a support statement, not a technical dependency.

- `"type"` is now `"commonjs"` rather than `"module"`. CommonJS is the default
  format and ESM is extension-tagged, which is what makes the `node10` stubs
  point at ordinary `.js`/`.d.ts` files with no extension-mapping subtleties.

  **Migration:** none for anyone importing through the package's public
  specifiers — `import` still resolves to ESM via the `exports` map. The one
  affected case is code reaching directly into `dist/` (for example
  `@bridgenodelabs/firestore-models/dist/core/index.js`), which was never an
  exported path and did not work correctly in `0.2.0` anyway. Those files now
  contain CommonJS; switch to the public specifier, which works from both
  formats.

## [0.2.0] - 2026-04-19

Published to npm. The repository's `package.json` was never bumped for this
release, so `main` remained at `0.1.1` while `0.2.0` shipped; `0.2.1` bumps
directly from `0.1.1`. The published `0.2.0` source is otherwise identical to
the repository at that point.

## [0.1.1] - 2026-04-16

Initial published release.

[0.2.1]: https://github.com/bridgenodelabs/firestore-models/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/bridgenodelabs/firestore-models/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/bridgenodelabs/firestore-models/releases/tag/v0.1.1
