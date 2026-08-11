# Packaging fixtures

These tests exist because the `0.2.0` regression was **invisible from inside the repo**.
Unit tests run against `src`. A workspace link or `file:..` install bypasses the `exports`
map and the `files` allowlist. Every one of those passes while the published tarball is
broken — which is exactly how `0.2.0` shipped.

So each fixture here installs the **packed tarball** (`npm pack` output) into a throwaway
temp directory and exercises it the way a real consumer would.

Run them with:

```bash
pnpm run build          # fixtures install the tarball, so dist/ must be current
pnpm run test:packaging
```

Filter to one fixture while iterating:

```bash
node scripts/verify-packaging.mjs ts-node10-cjs
```

## The fixtures

| Fixture          | Consumer shape                                              | Proves |
| ---------------- | ----------------------------------------------------------- | ------ |
| `cjs-require`    | plain Node, no TypeScript                                    | `require()` of root and `/core` returns real named exports, not `{ default }` |
| `esm-import`     | plain Node, `.mjs`                                           | named ESM imports from root and `/core` resolve and are callable |
| `ts-node10-cjs`  | `module: commonjs`, `moduleResolution: node10`, ts-jest      | **the release blocker** — `tsc --noEmit` passes and a Jest test round-trips a document |
| `ts-node16`      | `moduleResolution: node16`, both `commonjs` and `node16`     | types resolve to the format matching each mode; no ESM-masquerading-as-CJS |
| `bundler`        | `moduleResolution: bundler` + a real esbuild bundle          | build succeeds and the bundled output runs |

## Rules

No consumer-side workarounds are permitted in any fixture — no `transformIgnorePatterns`,
no `--experimental-vm-modules`, no `extensionsToTreatAsEsm`, no deep `dist/` import paths.
If a fixture needs one of those to pass, the packaging is still wrong and the release is
not done. Keep them honest.
