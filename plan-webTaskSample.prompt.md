## Plan: Web Task Sample

Build a runnable `samples/web-app` package that consumes the existing shared Task model, uses the Firebase Web SDK plus `firestore-type/adapters/firebase-client`, and demonstrates end-to-end create/read/update/delete flows against the Firebase Emulator Suite. The recommended approach is a small React + Vite app with a thin Firestore adapter layer so the UI only works with `Task` domain objects and never touches persisted Firestore shapes directly.

**Steps**

1. Scaffold `/Users/toddwseattle/dev/firestore-type/samples/web-app` as an isolated sample package with `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, and `src/` entry files. Keep package management self-contained rather than converting the repo into a workspace. This is the foundation for all later steps.
2. Add sample dependencies and scripts. Use React, React DOM, Vite, the Firebase Web SDK, TypeScript, and a local `file:../..` dependency on the root library. Include scripts for `dev`, `build`, and a typecheck-friendly build path. This depends on step 1.
3. Add client environment and Firebase initialization. Create `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/lib/firestore.ts` to read `VITE_FIREBASE_*` environment variables, initialize the app, connect Firestore to the emulator in development, and expose the `tasks` collection reference. This depends on steps 1 and 2.
4. Reuse the shared Task model instead of duplicating it. Add a thin entry such as `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/models/task.ts` that re-exports the shared model/types from `/Users/toddwseattle/dev/firestore-type/samples/shared/src/models/task.ts` or from the shared sample package entry. This blocks the adapter layer.
5. Build a web-specific adapter wrapper. Create `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/lib/taskAdapter.ts` that centralizes `readDocumentDomain`, `Timestamp.fromDate`, snapshot-to-domain mapping, and CRUD helpers. The wrapper should return domain `Task` objects plus Firestore document IDs so UI code never depends on persisted shapes. This depends on steps 3 and 4.
6. Build the app state layer. Add a focused hook such as `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/hooks/useTaskList.ts` that subscribes to the `tasks` collection, maps snapshots through the adapter, exposes loading/error state, and provides create/toggle/delete helpers. This depends on step 5.
7. Build the UI. Create `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/App.tsx` plus small components such as `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/components/TaskForm.tsx` and `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/components/TaskList.tsx`. The UI should demonstrate: creating a task, listing tasks, toggling done state, deleting tasks, and showing migrated legacy tasks seamlessly. This depends on step 6.
8. Add sample documentation. Create `/Users/toddwseattle/dev/firestore-type/samples/web-app/README.md` with setup, required `VITE_FIREBASE_*` variables, emulator instructions, a sample legacy `schemaVersion: 0` document for migration testing, and the exact flows the app demonstrates. This depends on steps 3 through 7.
9. Wire sample references back into root docs. Update `/Users/toddwseattle/dev/firestore-type/README.md`, `/Users/toddwseattle/dev/firestore-type/docs/user-guide.md`, and `/Users/toddwseattle/dev/firestore-type/docs/todo.md` so users can discover the web sample and the TODO accurately reflects the remaining sample work. This depends on step 8.
10. Verify the sample end to end. Build the root library, build the web sample, run the dev server, connect to the Firebase Emulator Suite, confirm read/write flows with current documents, and confirm a manually inserted `schemaVersion: 0` task migrates on read without UI changes. This depends on all prior steps.

**Relevant files**

- `/Users/toddwseattle/dev/firestore-type/samples/shared/src/models/task.ts` — existing shared Task model to reuse; source of truth for domain, persisted shapes, validator, and migration.
- `/Users/toddwseattle/dev/firestore-type/samples/shared/src/index.ts` — shared package entrypoint to reuse or mirror from the web sample.
- `/Users/toddwseattle/dev/firestore-type/src/adapters/firebase-client/index.ts` — read flow integration point via `readDocumentDomain`, `toTypedSnapshot`, and `toTypedQuerySnapshot`.
- `/Users/toddwseattle/dev/firestore-type/src/core/types.ts` — reference for `ToTimestamp` and model contract expectations at write time.
- `/Users/toddwseattle/dev/firestore-type/src/time/convert.ts` — reference for timestamp normalization behavior that the shared Task model already uses.
- `/Users/toddwseattle/dev/firestore-type/package.json` — root package reference for local `file:../..` consumption and current library tooling.
- `/Users/toddwseattle/dev/firestore-type/README.md` — root discoverability doc that should link to the web sample once implemented.
- `/Users/toddwseattle/dev/firestore-type/docs/user-guide.md` — should gain a web-sample reference after implementation.
- `/Users/toddwseattle/dev/firestore-type/docs/todo.md` — should mark `samples/web-app/` complete after implementation.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/package.json` — new sample package manifest.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/tsconfig.json` — TypeScript config for the sample app.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/vite.config.ts` — Vite + React configuration.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/index.html` — app entry HTML.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/main.tsx` — React bootstrap.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/App.tsx` — sample composition and high-level UI flow.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/lib/firestore.ts` — Firebase initialization and emulator connection.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/lib/taskAdapter.ts` — thin Firestore/domain boundary helper layer.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/models/task.ts` — thin re-export of the shared Task model/types.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/hooks/useTaskList.ts` — live collection read/write state hook.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/components/TaskForm.tsx` — create/edit form using domain `Task` values.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/components/TaskList.tsx` — task list rendering and actions.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/src/styles/index.css` — optional styling for a usable demo.
- `/Users/toddwseattle/dev/firestore-type/samples/web-app/README.md` — setup and emulator guide.

**Verification**

1. Run `pnpm build` at `/Users/toddwseattle/dev/firestore-type` so the root library remains healthy before validating the sample.
2. Install the web sample dependencies and run its build command to confirm the Vite/TypeScript setup is correct.
3. Start the Firebase Emulator Suite and the web sample dev server, then verify the app connects to the emulator rather than production Firestore in development.
4. Create a new task through the UI and confirm Firestore stores `schemaVersion: 1` plus timestamp fields serialized through `Timestamp.fromDate`.
5. Seed a legacy `schemaVersion: 0` task document manually, load the app, and confirm it renders as the latest `Task` domain shape without any UI branching on legacy fields.
6. Toggle a task’s `done` state and delete a task to confirm update/delete helpers work through the adapter wrapper.
7. Verify the UI layer only uses domain fields like `done`, `dueAt`, and `priority`, never persisted legacy fields like `completed` or `dueDate`.

**Decisions**

- Included scope: a runnable local emulator-backed web sample, not just illustrative snippets.
- Included scope: one shared Task model reused from `samples/shared`, with no duplicated migration logic in the web app.
- Recommended UI scope: compact CRUD plus live list updates; avoid adding authentication, routing, or design-system complexity. Uses firebase client side SDK for simplicity and direct adapter do not create a separate backend API layer since the sample’s value is demonstrating the Firestore/domain boundary, not building a feature-rich task manager.
- Recommended Firebase config: environment variables with emulator connection enabled automatically in development.
- Excluded scope for this pass: automated tests for the sample app, production deployment guidance, and multi-page app structure.

**Further Considerations**

1. If importing from `samples/shared` becomes awkward across package boundaries, the fallback is a local thin re-export file in the web app rather than duplicating model logic.
2. If emulator auto-detection becomes brittle, prefer an explicit `VITE_USE_FIREBASE_EMULATOR=true` toggle in the sample environment contract.
3. Keep the app intentionally small; the sample’s value is demonstrating the Firestore/domain boundary, not building a feature-rich task manager.
