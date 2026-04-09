import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@bridgenodelabs/firestore-models/core": fileURLToPath(
        new URL("../../src/core/index.ts", import.meta.url),
      ),
      "@bridgenodelabs/firestore-models/time": fileURLToPath(
        new URL("../../src/time/index.ts", import.meta.url),
      ),
      "@bridgenodelabs/firestore-models/adapters/firebase-client": fileURLToPath(
        new URL("../../src/adapters/firebase-client/index.ts", import.meta.url),
      ),
      "@bridgenodelabs/firestore-models/adapters/firebase-admin": fileURLToPath(
        new URL("../../src/adapters/firebase-admin/index.ts", import.meta.url),
      ),
      "@bridgenodelabs/firestore-models/react": fileURLToPath(
        new URL("../../src/react/index.ts", import.meta.url),
      ),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
  },
});
