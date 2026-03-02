/**
 * Firebase client adapter for firestore-type.
 *
 * Provides helpers for working with the Firebase Web SDK
 * (`firebase/firestore`) on the client side.
 *
 * Usage:
 *   import { toTypedSnapshot, readDocumentDomain } from "firestore-type/adapters/firebase-client";
 */

import type { DocumentData, TypedDocumentSnapshot, TypedQuerySnapshot } from '../../types.js';
import type { ModelSpec, PersistedBase } from '../../core/types.js';
import { readDomain } from '../../core/migrate.js';

/**
 * Minimal structural interface matching `DocumentSnapshot` from the
 * Firebase Web SDK (`firebase/firestore`).
 */
export interface BrowserDocumentSnapshot<T> {
  id: string;
  exists(): boolean;
  data(): T | undefined;
}

/**
 * Minimal structural interface matching `QuerySnapshot` from the
 * Firebase Web SDK (`firebase/firestore`).
 */
export interface BrowserQuerySnapshot<T> {
  docs: BrowserDocumentSnapshot<T>[];
  empty: boolean;
  size: number;
}

/**
 * Wrap a Firebase Web SDK `DocumentSnapshot` in the library's
 * `TypedDocumentSnapshot` interface.
 */
export function toTypedSnapshot<T extends DocumentData>(
  snapshot: BrowserDocumentSnapshot<T>,
): TypedDocumentSnapshot<T> {
  return {
    id: snapshot.id,
    exists: snapshot.exists(),
    data: () => snapshot.data(),
  };
}

/**
 * Wrap a Firebase Web SDK `QuerySnapshot` in the library's
 * `TypedQuerySnapshot` interface.
 */
export function toTypedQuerySnapshot<T extends DocumentData>(
  snapshot: BrowserQuerySnapshot<T>,
): TypedQuerySnapshot<T> {
  return {
    docs: snapshot.docs.map((d) => toTypedSnapshot<T>(d)),
    empty: snapshot.empty,
    size: snapshot.size,
  };
}

/**
 * Read a domain object from a Firebase Web SDK `DocumentSnapshot`,
 * running validation and schema migration as needed.
 *
 * Combines snapshot unwrapping with the full migration-on-read flow:
 * raw → validate → migrate → hydrate domain object.
 *
 * @throws {Error} if the document does not exist or validation/migration fails.
 */
export function readDocumentDomain<Domain, PersistedLatest extends PersistedBase>(
  snapshot: BrowserDocumentSnapshot<DocumentData>,
  spec: ModelSpec<Domain, PersistedLatest>,
): Domain {
  if (!snapshot.exists()) {
    throw new Error(`Document "${snapshot.id}" does not exist.`);
  }
  const raw = snapshot.data();
  if (raw === undefined) {
    throw new Error(`Document "${snapshot.id}" returned no data.`);
  }
  return readDomain(raw, spec);
}
