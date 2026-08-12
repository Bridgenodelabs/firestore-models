/**
 * Production environment.
 *
 * Replace the placeholders with your real Firebase project's web config before
 * deploying. `useEmulator: false` sends traffic to the live project, so the app
 * refuses to start until these are filled in — see `src/lib/firestore.ts`.
 *
 * Firebase web config values are not secrets (they ship in the client bundle),
 * but they are project-specific, which is why they are left blank here rather
 * than pointing at someone else's project.
 */
export const environment = {
  production: true,
  useEmulator: false,
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: "",
  },
  emulator: {
    host: "127.0.0.1",
    port: 8080,
  },
};
