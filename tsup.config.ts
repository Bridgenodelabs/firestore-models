import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "time/index": "src/time/index.ts",
    "adapters/firebase-client/index": "src/adapters/firebase-client/index.ts",
    "adapters/firebase-admin/index": "src/adapters/firebase-admin/index.ts",
    "react/index": "src/react/index.ts",
  },
  // CommonJS is the package default (`"type": "commonjs"`), so cjs output keeps
  // the bare `.js` extension and ESM is extension-tagged as `.mjs`. This is what
  // lets `moduleResolution: node10` consumers — which ignore `exports` entirely —
  // resolve the node10 subpath stubs to ordinary `.js`/`.d.ts` files.
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  // Already implicit via peerDependencies; stated explicitly so the optional
  // peers can never be inlined into the bundle.
  external: ["firebase", "firebase-admin", "react", "react-dom"],
});
