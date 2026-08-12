/**
 * Development environment.
 *
 * Angular has no Vite-style `import.meta.env` / `.env.local` loading, so where
 * the React sample reads `VITE_*` variables this sample uses the idiomatic
 * Angular pattern: a committed `environment.ts`, swapped for
 * `environment.production.ts` at build time via `fileReplacements` in
 * angular.json.
 *
 * The defaults below are the Firebase emulator's demo values — no real project
 * and no secrets. They are safe to commit and let the sample run with zero
 * setup against `firebase emulators:start --only firestore`.
 */
export const environment = {
  production: false,
  useEmulator: true,
  firebase: {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    appId: "1:1234567890:web:abcdef123456",
  },
  emulator: {
    host: "127.0.0.1",
    port: 8080,
  },
};
