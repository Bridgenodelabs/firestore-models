# Angular Task Sample

An Angular 22 standalone application demonstrating `@bridgenodelabs/firestore-models`
against the Firebase Emulator Suite. It is the Angular counterpart to
[`samples/web-app`](../web-app/README.md) (React + Vite) — same Task model, same
Firestore collection, same behaviour, different framework.

## What it demonstrates

- **Migration-on-read.** A `schemaVersion: 0` document in Firestore renders as a
  current-shape domain object. `completed: true` becomes `done: true`, and the
  missing `priority` field is defaulted by the migration.
- **The domain / persisted boundary.** Components only ever see `Task` domain
  objects. `TimestampLike` → `Date` conversion happens at the adapter.
- **Framework-agnostic consumption.** The library ships React hooks at
  `@bridgenodelabs/firestore-models/react` and nothing Angular-specific. It does
  not need to: the hooks are a thin convenience over pieces that work anywhere,
  so this sample uses `readDocumentDomain` from
  `/adapters/firebase-client` plus the shared `taskModel`, and wraps them in
  Angular signals.
- **Live Firestore subscriptions** via `onSnapshot`, with the subscription torn
  down through `DestroyRef`.
- **Zoneless change detection.** All reactivity flows through signals, so
  `zone.js` is never loaded — it is an optional peer of `@angular/core` and is
  deliberately absent from `package.json`.

## Prerequisites

- **Node.js 22.22.3+** (or 24.15+, or 26+). This is the Angular CLI's own
  requirement and it is enforced at startup, not merely warned about — an older
  Node fails with `The Angular CLI requires a minimum Node.js version of…`.
- **pnpm** 9 or later
- **Firebase Emulator Suite** (`npm install -g firebase-tools`), which needs a
  JDK on your PATH

## Setup

From the repository root, build the library first — this sample consumes the
built package through its `exports` map, not the library's TypeScript sources:

```bash
pnpm install
pnpm run build
```

Then install this sample and the shared model package it imports:

```bash
pnpm --dir samples/shared install
pnpm --dir samples/angular-app install
```

> `samples/shared` needs its own install because the Task model is imported by
> relative path and resolves the library from its own `node_modules`.

## Running

```bash
# Terminal 1 — emulator
cd samples/angular-app
firebase emulators:start --only firestore

# Terminal 2 — dev server
cd samples/angular-app
pnpm dev
```

The app is served at <http://127.0.0.1:4200> and the Emulator UI at
<http://127.0.0.1:4000>.

Create a few tasks, toggle them done, and delete them. Every write goes through
`taskModel.toPersisted`; every read comes back through `readDocumentDomain`.

### Seeing migration-on-read

Add a legacy document by hand in the Emulator UI, in the `tasks` collection:

| Field           | Type      | Value             |
| --------------- | --------- | ----------------- |
| `schemaVersion` | number    | `0`               |
| `title`         | string    | `Legacy task`     |
| `completed`     | boolean   | `true`            |
| `dueDate`       | timestamp | any date          |

It appears in the list immediately, struck through (because `completed: true`
migrated to `done: true`) and with priority `medium` — the default the migration
supplies for a field that did not exist at v0. The component never sees the v0
shape.

## Verification

```bash
pnpm typecheck        # app sources and the scripts/ runner
pnpm build            # production build
pnpm verify:live      # CRUD + migration against a running emulator
```

`verify:live` mirrors the React sample's script: it creates a current-version
task, reads it back through `readDocumentDomain`, seeds a `schemaVersion: 0`
document, asserts the migration produced the right domain object, toggles, and
cleans up.

## Configuration

Angular has no Vite-style `import.meta.env` / `.env.local` loading, so where the
React sample reads `VITE_*` variables this sample uses the idiomatic Angular
pattern: [`src/environments/environment.ts`](src/environments/environment.ts),
swapped for `environment.production.ts` at build time via `fileReplacements` in
`angular.json`.

The committed development values are the emulator's demo placeholders — no real
project, no secrets — so the sample runs with zero setup. For a real deployment,
fill in `environment.production.ts` with your project's web config; the app
renders a configuration error instead of the task list if those are left blank.

## Project layout

```
src/
├── app/
│   ├── app.component.ts          Root standalone component
│   ├── task-form.component.ts    Create form (signals, no FormsModule)
│   ├── task-list.component.ts    List with toggle/delete
│   └── task-store.ts             Signal store — the useTaskList analogue
├── environments/                 Build-time config (fileReplacements)
├── lib/firestore.ts              Firebase init + emulator wiring
├── models/task.ts                Re-export of ../../shared Task model
├── main.ts                       bootstrapApplication, zoneless
└── styles.css                    Shared design system with the React sample
scripts/
└── liveVerification.ts           Emulator CRUD + migration check
```

## Differences from the React sample

| | React (`web-app`) | Angular (`angular-app`) |
| --- | --- | --- |
| Reactivity | `useFirestoreCollectionDomain` / `useFirestoreMutations` hooks | `TaskStore` service with signals |
| Library entry used | `/react` | `/adapters/firebase-client` + `/core` |
| Library resolution | tsconfig `paths` → library **source** | installed package → built `dist` via `exports` |
| Config | `.env.local` (`VITE_*`) | `src/environments/*.ts` |
| Dev server port | 5174 | 4200 |
| Change detection | React reconciler | zoneless, signal-driven |

The `paths` difference is deliberate: this sample resolves
`@bridgenodelabs/firestore-models` the way a published consumer does, which
means it also exercises the package's `exports` map and dual CJS/ESM build.
