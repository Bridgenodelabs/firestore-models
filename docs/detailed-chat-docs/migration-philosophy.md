# Migration Philosophy

## Problem Statement

Firestore allows any document shape at any time.
Without discipline, this leads to:

- Schema drift
- Undetectable breaking changes
- Production-only failures
- Fear of refactoring

Migrations are the mechanism by which we regain control.

---

## Migration-on-Read

This library uses **migration-on-read**, not bulk backfills.

### Why

- Old documents may live for years
- Backfills are risky and operationally expensive
- Partial migrations create undefined states

Migration-on-read guarantees:

- All domain logic sees the latest schema
- Old data remains valid forever
- No large batch jobs required

---

## Versioned Persistence

Every persisted document includes:

````ts
schemaVersion: number;
``
This allows:

Explicit detection of schema shape

Mechanical migration dispatch

Clear reasoning during debugging

Migration Rules

Migrations are pure functions

They never mutate inputs

They always return a newer schema

They never depend on domain logic

They are idempotent per version

Example
```ts
function migrateV1ToV2(old: PersistedV1): PersistedV2 {
  return {
    ...old,
    schemaVersion: 2,
    newField: defaultValue,
  };
}
````

Validation as a Gate

Validation is optional but strongly encouraged.

It exists to:

Catch corrupted data

Detect manual Firestore edits

Fail fast instead of propagating bad state

Validation should happen before migration.

Domain Isolation

Domain objects:

Never branch on schemaVersion

Never contain migration logic

Always assume latest shape

This keeps business logic clean and stable.

Mental Model

Firestore stores history.
Migrations translate history into the present.
