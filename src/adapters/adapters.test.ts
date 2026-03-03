import { describe, it, expect } from 'vitest';
import {
  toTypedSnapshot as clientToTypedSnapshot,
  toTypedQuerySnapshot as clientToTypedQuerySnapshot,
  readDocumentDomain as clientReadDocumentDomain,
  type BrowserDocumentSnapshot,
  type BrowserQuerySnapshot,
} from './firebase-client/index.js';
import {
  toTypedSnapshot as adminToTypedSnapshot,
  toTypedQuerySnapshot as adminToTypedQuerySnapshot,
  readDocumentDomain as adminReadDocumentDomain,
  type AdminDocumentSnapshot,
  type AdminQuerySnapshot,
} from './firebase-admin/index.js';
import { defineModel } from '../core/defineModel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBrowserSnap(
  id: string,
  exists: boolean,
  docData?: Record<string, unknown>,
): BrowserDocumentSnapshot<Record<string, unknown>> {
  return { id, exists: () => exists, data: () => docData };
}

function makeAdminSnap(
  id: string,
  exists: boolean,
  docData?: Record<string, unknown>,
): AdminDocumentSnapshot<Record<string, unknown>> {
  return { id, exists, data: () => docData };
}

const simpleSpec = defineModel({
  currentVersion: 1,
  toPersisted: (d: { name: string }) => ({ schemaVersion: 1 as const, name: d.name }),
  fromPersisted: (p) => ({ name: p.name }),
  migrations: {
    0: (doc: { schemaVersion: number; oldName: string }) => ({
      schemaVersion: 1 as const,
      name: doc.oldName,
    }),
  },
});

// ---------------------------------------------------------------------------
// firebase-client adapter
// ---------------------------------------------------------------------------

describe('firebase-client: toTypedSnapshot', () => {
  it('sets exists to true when exists() returns true', () => {
    const snap = makeBrowserSnap('doc1', true, { schemaVersion: 1, name: 'Alice' });
    expect(clientToTypedSnapshot(snap).exists).toBe(true);
  });

  it('sets exists to false when exists() returns false', () => {
    const snap = makeBrowserSnap('doc2', false);
    expect(clientToTypedSnapshot(snap).exists).toBe(false);
  });

  it('preserves the document id', () => {
    const snap = makeBrowserSnap('my-id', true, { schemaVersion: 1, name: 'x' });
    expect(clientToTypedSnapshot(snap).id).toBe('my-id');
  });

  it('data() passes through the underlying data', () => {
    const data = { schemaVersion: 1 as const, name: 'Bob' };
    const snap = makeBrowserSnap('doc3', true, data);
    expect(clientToTypedSnapshot(snap).data()).toEqual(data);
  });

  it('data() returns undefined for non-existent doc', () => {
    const snap = makeBrowserSnap('doc4', false, undefined);
    expect(clientToTypedSnapshot(snap).data()).toBeUndefined();
  });
});

describe('firebase-client: toTypedQuerySnapshot', () => {
  it('wraps each doc in the docs array', () => {
    const querySnap: BrowserQuerySnapshot<Record<string, unknown>> = {
      docs: [
        makeBrowserSnap('a', true, { schemaVersion: 1, name: 'A' }),
        makeBrowserSnap('b', true, { schemaVersion: 1, name: 'B' }),
      ],
      empty: false,
      size: 2,
    };
    const result = clientToTypedQuerySnapshot(querySnap);
    expect(result.docs).toHaveLength(2);
    expect(result.docs[0].id).toBe('a');
    expect(result.docs[1].id).toBe('b');
  });

  it('preserves empty and size', () => {
    const querySnap: BrowserQuerySnapshot<never> = { docs: [], empty: true, size: 0 };
    const result = clientToTypedQuerySnapshot(querySnap);
    expect(result.empty).toBe(true);
    expect(result.size).toBe(0);
  });
});

describe('firebase-client: readDocumentDomain', () => {
  it('returns the hydrated domain object', () => {
    const snap = makeBrowserSnap('doc1', true, { schemaVersion: 1, name: 'Ada' });
    const result = clientReadDocumentDomain(snap, simpleSpec);
    expect(result).toEqual({ name: 'Ada' });
  });

  it('runs migration before hydrating', () => {
    const snap = makeBrowserSnap('doc1', true, { schemaVersion: 0, oldName: 'Ada' });
    const result = clientReadDocumentDomain(snap, simpleSpec);
    expect(result).toEqual({ name: 'Ada' });
  });

  it('throws when the document does not exist', () => {
    const snap = makeBrowserSnap('doc2', false);
    expect(() => clientReadDocumentDomain(snap, simpleSpec)).toThrow(
      'Document "doc2" does not exist.',
    );
  });

  it('throws when exists() is true but data() returns undefined', () => {
    const snap: BrowserDocumentSnapshot<Record<string, unknown>> = {
      id: 'doc3',
      exists: () => true,
      data: () => undefined,
    };
    expect(() => clientReadDocumentDomain(snap, simpleSpec)).toThrow(
      'Document "doc3" returned no data.',
    );
  });
});

// ---------------------------------------------------------------------------
// firebase-admin adapter
// ---------------------------------------------------------------------------

describe('firebase-admin: toTypedSnapshot', () => {
  it('sets exists to true when the property is true', () => {
    const snap = makeAdminSnap('doc1', true, { schemaVersion: 1, name: 'Alice' });
    expect(adminToTypedSnapshot(snap).exists).toBe(true);
  });

  it('sets exists to false when the property is false', () => {
    const snap = makeAdminSnap('doc2', false);
    expect(adminToTypedSnapshot(snap).exists).toBe(false);
  });

  it('preserves the document id', () => {
    const snap = makeAdminSnap('admin-id', true, { schemaVersion: 1, name: 'x' });
    expect(adminToTypedSnapshot(snap).id).toBe('admin-id');
  });

  it('data() passes through the underlying data', () => {
    const data = { schemaVersion: 1 as const, name: 'Carol' };
    const snap = makeAdminSnap('doc3', true, data);
    expect(adminToTypedSnapshot(snap).data()).toEqual(data);
  });

  it('data() returns undefined for non-existent doc', () => {
    const snap = makeAdminSnap('doc4', false, undefined);
    expect(adminToTypedSnapshot(snap).data()).toBeUndefined();
  });
});

describe('firebase-admin: toTypedQuerySnapshot', () => {
  it('wraps each doc in the docs array', () => {
    const querySnap: AdminQuerySnapshot<Record<string, unknown>> = {
      docs: [
        makeAdminSnap('a', true, { schemaVersion: 1, name: 'A' }),
        makeAdminSnap('b', true, { schemaVersion: 1, name: 'B' }),
      ],
      empty: false,
      size: 2,
    };
    const result = adminToTypedQuerySnapshot(querySnap);
    expect(result.docs).toHaveLength(2);
    expect(result.docs[0].id).toBe('a');
    expect(result.docs[1].id).toBe('b');
  });

  it('preserves empty and size', () => {
    const querySnap: AdminQuerySnapshot<never> = { docs: [], empty: true, size: 0 };
    const result = adminToTypedQuerySnapshot(querySnap);
    expect(result.empty).toBe(true);
    expect(result.size).toBe(0);
  });
});

describe('firebase-admin: readDocumentDomain', () => {
  it('returns the hydrated domain object', () => {
    const snap = makeAdminSnap('doc1', true, { schemaVersion: 1, name: 'Ada' });
    const result = adminReadDocumentDomain(snap, simpleSpec);
    expect(result).toEqual({ name: 'Ada' });
  });

  it('runs migration before hydrating', () => {
    const snap = makeAdminSnap('doc1', true, { schemaVersion: 0, oldName: 'Ada' });
    const result = adminReadDocumentDomain(snap, simpleSpec);
    expect(result).toEqual({ name: 'Ada' });
  });

  it('throws when the document does not exist', () => {
    const snap = makeAdminSnap('doc2', false);
    expect(() => adminReadDocumentDomain(snap, simpleSpec)).toThrow(
      'Document "doc2" does not exist.',
    );
  });

  it('throws when exists is true but data() returns undefined', () => {
    const snap: AdminDocumentSnapshot<Record<string, unknown>> = {
      id: 'doc3',
      exists: true,
      data: () => undefined,
    };
    expect(() => adminReadDocumentDomain(snap, simpleSpec)).toThrow(
      'Document "doc3" returned no data.',
    );
  });
});
