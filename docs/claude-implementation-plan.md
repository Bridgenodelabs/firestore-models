# Implementation Plan: firestore-type Library Completion + Samples

> Authoritative design docs: [docs/firestore-object-toolkit-design.md](firestore-object-toolkit-design.md) and [docs/detailed-chat-docs/migration-philosophy.md](detailed-chat-docs/migration-philosophy.md).
> Agents must NOT invent public APIs, change architectural boundaries, or add Firebase imports outside `src/adapters/**`.

---

## Context
The library has a solid core (types, migration, validation, timestamp helpers) but is blocked by unresolved merge conflicts in `package.json`, `tsconfig.json`, and `src/index.ts`. The adapter subpath exports exist as placeholder types only. No `samples/` directory exists. Tests are split across two incompatible test runners (Vitest + node:test).

The detailed design docs (`design-chat.md`, `migration-philosophy.md`, `agent-guidance.md`) confirm:
- Domain objects always use `Date`, never Firestore `Timestamp`
- Timestamp conversion to/from Firestore `Timestamp` happens **only at the adapter boundary**
- Migrations are pure functions — no side effects, no domain logic, no mutation of inputs
- Validation runs **before** migration (already implemented correctly in `readDomain`)
- Domain objects never branch on `schemaVersion`

---

## Hard Constraints (enforced throughout)

- No Firebase imports in `src/core/**` or `src/time/**` — only in `src/adapters/**`
- `schemaVersion` must be present in all persisted types
- Migrations must be pure functions
- Domain objects use `Date`, not `TimestampLike` / `Timestamp`
- Do not invent new public APIs beyond what the design docs describe

---

## Phase 1 — Resolve Merge Conflicts

### 1a. `package.json` → final form
Merge "ours" (tsup build, browser/node adapter exports) with "theirs" (core/time/firebase-client/firebase-admin subpath exports):
- Build: `tsup` with scripts: `build`, `dev`, `test` (vitest run), `lint`
- Subpath exports:
  - `.` → `dist/index.js`
  - `./core` → `dist/core/index.js`
  - `./time` → `dist/time/index.js`
  - `./adapters/firebase-client` → `dist/adapters/firebase-client/index.js`
  - `./adapters/firebase-admin` → `dist/adapters/firebase-admin/index.js`
- peerDeps: `firebase >=10.0.0` (optional) and `firebase-admin >=12.0.0` (optional)
- devDeps: tsup ^8, typescript ^5.4, vitest ^3

### 1b. `tsconfig.json` → final form
Use "ours" settings (compatible with tsup):
- `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`
- `lib: [ES2020, DOM]`, `strict: true`, declaration + declarationMap + sourceMap
- `outDir: ./dist`, `rootDir: ./src`, `include: ["src"]`

### 1c. `src/index.ts` → final form
Move `TypedDocumentSnapshot`, `DocumentData`, `TypedQuerySnapshot`, and `getDocumentData` into a new `src/types.ts` (avoids circular imports with adapters). Then:

```ts
// src/index.ts
export * as core from './core/index.js';
export * as time from './time/index.js';
export type { DocumentData, TypedDocumentSnapshot, TypedQuerySnapshot } from './types.js';
export { getDocumentData } from './types.js';
```

### 1d. `docs/design.md` — housekeeping alias
`agent-guidance.md` references `docs/design.md` as authoritative. Create `docs/design.md` that re-exports / is a copy of `docs/firestore-object-toolkit-design.md` so agent prompts referencing `docs/design.md` resolve correctly. (Or rename — whichever is less disruptive.)

---

## Phase 2 — Fix Adapter Subpath Exports

Real implementations exist in `src/adapters/browser.ts` (client SDK) and `src/adapters/node.ts` (admin SDK), but the subpath exports `firebase-client/index.ts` and `firebase-admin/index.ts` are empty placeholders.

**Strategy:** Move content into the subpath index files, update imports, delete redundant files.

### `src/adapters/firebase-client/index.ts`
Replace placeholder with:
- Content from `src/adapters/browser.ts`
- Import updated: `from '../../types.js'` (since snapshot types move to `src/types.ts`)
- Add `readDocumentDomain<Domain, Persisted>(snapshot, spec)` — integration helper that calls `readDomain(snapshot.data(), spec)`, converting raw Firestore data to a typed domain object in one call. This bridges the design's read flow (raw → validate → migrate → hydrate) at the adapter layer.

### `src/adapters/firebase-admin/index.ts`
Same treatment as firebase-client but for `src/adapters/node.ts`.

### `src/adapters/browser.ts` and `src/adapters/node.ts`
Delete — content merged into the subpath exports above.

### `tsup.config.ts` — update entry points
```ts
entry: {
  index: 'src/index.ts',
  'core/index': 'src/core/index.ts',
  'time/index': 'src/time/index.ts',
  'adapters/firebase-client/index': 'src/adapters/firebase-client/index.ts',
  'adapters/firebase-admin/index': 'src/adapters/firebase-admin/index.ts',
}
```

---

## Phase 2.5 — TimestampFactory in ModelSpec ✅

**Problem surfaced during Phase 2:** `ModelSpec.toPersisted` had signature `(domain: Domain) => PersistedLatest`, giving no way to convert `Date` fields to a Firestore `Timestamp` without importing Firebase SDK inside the model definition — violating the "Firebase imports only in adapters" constraint.

**Solution:** Add an optional `ToTimestamp` factory parameter to `toPersisted`.

### Changes

**`src/core/types.ts`**
- Import `TimestampLike` from `../time/timestampLike.js` (one-way dep; no cycle)
- Export `ToTimestamp = (date: Date) => TimestampLike` — a named, documented type
- Change `toPersisted` signature:
  ```ts
  toPersisted: (domain: Domain, toTimestamp?: ToTimestamp) => PersistedLatest;
  ```

### Why this works
- **Optional** — models with no timestamp fields call `toPersisted(domain)` unchanged. Existing implementations that only accept `domain` continue to typecheck (TypeScript allows functions to ignore trailing parameters).
- **No Firebase imports in core** — `TimestampLike` is the library's own duck-typed interface. Firebase `Timestamp` satisfies it structurally.
- **Caller supplies the factory** — at write time: `TaskModel.toPersisted(task, Timestamp.fromDate.bind(Timestamp))`. The library never holds a Firebase reference.
- **Read path unchanged** — `readDomain` only calls `fromPersisted`, never `toPersisted`.

### Write-side usage (samples reference)
```ts
// Web SDK (firebase-client)
import { Timestamp } from 'firebase/firestore';
const persisted = TaskModel.toPersisted(task, (d) => Timestamp.fromDate(d));
await addDoc(ref, persisted);

// Admin SDK (firebase-admin)
import { Timestamp } from 'firebase-admin/firestore';
const persisted = TaskModel.toPersisted(task, (d) => Timestamp.fromDate(d));
await db.collection('tasks').add(persisted);
```

---

## Phase 3 — Expand & Unify Tests

All tests use Vitest (already a devDep). Remove `test/core.test.mjs` and `test/time.test.mjs` (node:test runner). Migrate and expand into `.test.ts` files alongside source.

### `src/core/core.test.ts` (replaces `test/core.test.mjs` + expands)
- `assertSchemaVersion`: 0 is valid; negative, float, missing key, and string value all throw
- `migratePersisted`: v0→v2 via two steps; already at currentVersion is no-op; newer than currentVersion throws; missing migration step throws
- `defineModel`: identity helper returns spec unchanged
- `readDomain`: full flow (validate → migrate → fromPersisted); `validatePersisted` is called before migration; `validatePersisted` rejection propagates and stops migration
- `assertObject` / `assertNumber` / `createValidator`: valid and invalid inputs, custom error messages

### `src/time/time.test.ts` (replaces `test/time.test.mjs` + expands)
- `dateFromTimestamp`: `Date` instance passthrough; `toDate()` duck type; `seconds+nanoseconds` shape; `_seconds+_nanoseconds` shape; sub-millisecond nanosecond rounding (verified per existing formula); invalid input (no valid shape) throws
- `timestampFromDate`: factory called with the correct `Date`; return value equals factory output

### `src/adapters/adapters.test.ts` (new)
- Firebase-client adapter: `toTypedSnapshot` converts `exists()` method → `exists` boolean property; `data()` passes through; non-existent doc has `exists: false`
- Firebase-client adapter: `toTypedQuerySnapshot` wraps docs array, preserves `empty` and `size`
- Firebase-admin adapter: same tests but `AdminDocumentSnapshot.exists` is already a boolean property (not a method)

### `src/index.test.ts` (verify after refactor)
- Existing `getDocumentData` tests are sufficient; verify imports still resolve after types move to `src/types.ts`

### `vitest.config.ts`
Already correct (`include: ["src/**/*.test.ts"]`) — no changes needed.

---

## Phase 4 — Samples Directory

All three design representations (Domain, Persisted, Migrated) and the full read/write flow are demonstrated. Samples are self-contained — each has its own `package.json`. `shared/` holds the domain model to avoid duplication.

### Structure
```
samples/
  shared/
    package.json          # name: "@samples/shared"
    tsconfig.json
    src/
      models/
        task.ts           # Task domain model: v0→v1 migration + timestamp handling
      index.ts
    README.md
  web-app/
    package.json          # React + Vite + firebase web SDK
    tsconfig.json
    vite.config.ts
    index.html
    src/
      firebase.ts         # Firebase init via VITE_FIREBASE_* env vars
      models/task.ts      # re-exports from @samples/shared
      components/
        TaskList.tsx      # reads tasks, calls readDomain via firebase-client adapter
        AddTask.tsx       # form: calls toPersisted, then addDoc
      App.tsx
      main.tsx
    README.md
  firebase-function/
    package.json          # firebase-functions + firebase-admin
    tsconfig.json
    src/
      models/task.ts      # re-exports from @samples/shared
      index.ts            # onTaskCreate trigger: readDomain → log domain object
    README.md
```

### Task Domain Model (`samples/shared/src/models/task.ts`)

Demonstrates: field rename migration, `Date` in domain, `TimestampLike` only in persisted shapes.

```ts
// Domain — uses Date, not TimestampLike
export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueAt?: Date;              // canonical internal type is Date
  priority: 'low' | 'medium' | 'high';
}

// Persisted v0 (legacy: 'completed' instead of 'done', no priority, 'dueDate' field)
interface TaskPersistedV0 extends PersistedBase {
  schemaVersion: 0;
  title: string;
  completed: boolean;
  dueDate?: TimestampLike;   // Firestore Timestamp shape, not Date
}

// Persisted v1 (current)
interface TaskPersistedV1 extends PersistedBase {
  schemaVersion: 1;
  title: string;
  done: boolean;
  dueAt?: TimestampLike;     // Firestore Timestamp shape, not Date
  priority: 'low' | 'medium' | 'high';
}

// Pure migration function — no domain logic, no side effects
const migrate0to1 = (v0: TaskPersistedV0): TaskPersistedV1 => ({
  schemaVersion: 1,
  title: v0.title,
  done: v0.completed,
  dueAt: v0.dueDate,         // field rename only; timestamp stays as-is
  priority: 'medium',        // default
});

export const TaskModel = defineModel<Task, TaskPersistedV1>({
  currentVersion: 1,
  migrations: { 0: migrate0to1 },
  toPersisted: (task, timestampFactory) => ({
    schemaVersion: 1,
    title: task.title,
    done: task.done,
    // Timestamp conversion happens here, at the persisted boundary
    dueAt: task.dueAt ? timestampFromDate(task.dueAt, timestampFactory) : undefined,
    priority: task.priority,
  }),
  fromPersisted: (p) => ({
    id: '',           // caller sets id from document ref
    title: p.title,
    done: p.done,
    // Date conversion from Timestamp happens here, at the read boundary
    dueAt: p.dueAt ? dateFromTimestamp(p.dueAt) : undefined,
    priority: p.priority,
  }),
});
```

### Web App (`samples/web-app/`)
- `TaskList.tsx`: reads Firestore collection, uses `readDocumentDomain(snapshot, TaskModel)` from firebase-client adapter to get typed `Task[]`
- `AddTask.tsx`: form input → `TaskModel.toPersisted(newTask, Timestamp.fromDate)` → `addDoc`
- Demonstrates the complete read and write flow from design-chat.md

### Firebase Function (`samples/firebase-function/`)
- `onTaskCreate` Firestore trigger
- Reads `event.data.after.data()` (raw unknown)
- Calls `readDomain(rawData, TaskModel)` from the firebase-admin adapter
- Logs the resulting typed `Task` domain object
- Demonstrates server-side migration-on-read

---

## Phase 5 — Verification Checklist

After implementation, verify against agent-guidance.md checklist:

- [ ] No Firebase imports in `src/core/**` or `src/time/**`
- [ ] `schemaVersion` present in all persisted interfaces
- [ ] Migrations are pure functions (no mutation, no domain logic)
- [ ] Domain objects use `Date`, not `Timestamp` or `TimestampLike`
- [ ] `pnpm test` passes (all Vitest tests)
- [ ] `pnpm build` passes (tsup bundles all entry points with `.d.ts`)
- [ ] `pnpm lint` passes (`tsc --noEmit`)

```bash
cd /Users/toddwseattle/dev/firestore-type
pnpm build   # exits 0, dist/ has all entry points + .d.ts files
pnpm test    # all vitest tests pass
pnpm lint    # tsc --noEmit passes
```

---

## Critical Files

| File | Action |
|------|--------|
| `package.json` | Fix merge conflicts → tsup build + full subpath exports |
| `tsconfig.json` | Fix merge conflicts → ES2020/ESNext/bundler |
| `src/types.ts` | **New** — TypedDocumentSnapshot, getDocumentData |
| `src/index.ts` | Fix conflicts → export core/time namespaces + re-export types |
| `src/adapters/firebase-client/index.ts` | Replace placeholder with real implementation |
| `src/adapters/firebase-admin/index.ts` | Replace placeholder with real implementation |
| `src/adapters/browser.ts` | **Delete** (merged into firebase-client) |
| `src/adapters/node.ts` | **Delete** (merged into firebase-admin) |
| `tsup.config.ts` | Add all entry points |
| `src/core/core.test.ts` | **New** comprehensive tests |
| `src/time/time.test.ts` | **New** comprehensive tests |
| `src/adapters/adapters.test.ts` | **New** adapter tests |
| `test/core.test.mjs` | **Delete** (superseded by Vitest) |
| `test/time.test.mjs` | **Delete** (superseded by Vitest) |
| `docs/design.md` | **New** — alias/copy of `firestore-object-toolkit-design.md` |
| `samples/shared/src/models/task.ts` | **New** shared Task model |
| `samples/shared/package.json` | **New** |
| `samples/web-app/` | **New** React/Vite app |
| `samples/firebase-function/` | **New** Cloud Function |
