/**
 * A model definition shaped like the consumer that surfaced the 0.2.0 bug:
 * TypeScript, CommonJS, importing the `/core` subpath by its public specifier.
 *
 * Against 0.2.0 the import on the next line is TS2307.
 */
import {
  assertObject,
  createValidator,
  defineModel,
  type ModelSpec,
  type PersistedBase,
} from "@bridgenodelabs/firestore-models/core";

export interface UserProfile {
  displayName: string;
  loginCount: number;
}

export interface PersistedUserProfileV1 extends PersistedBase {
  schemaVersion: 1;
  name: string;
}

export interface PersistedUserProfileV2 extends PersistedBase {
  schemaVersion: 2;
  displayName: string;
  loginCount: number;
}

export type AnyPersistedUserProfile = PersistedUserProfileV1 | PersistedUserProfileV2;

/**
 * `readDomain` runs `validatePersisted` against the *raw* document, before any
 * migration, so this validator has to accept every schema version still on disk
 * — not just the latest one.
 *
 * Explicitly annotated because `createValidator` returns an assertion
 * signature, and TypeScript requires an explicit type annotation on any name
 * used as a call target for one (TS2775). That is a known ergonomic wrinkle
 * deferred to 0.3.0 — it is a language rule, not a packaging defect, so the
 * fixture works with it rather than around it.
 */
export const assertPersistedUserProfile: (
  value: unknown,
) => asserts value is AnyPersistedUserProfile = createValidator<AnyPersistedUserProfile>(
  (value) => {
    assertObject(value);

    if (value.schemaVersion === 1) {
      if (typeof value.name !== "string") {
        throw new Error("name must be a string");
      }
      return;
    }

    if (typeof value.displayName !== "string") {
      throw new Error("displayName must be a string");
    }
    if (typeof value.loginCount !== "number") {
      throw new Error("loginCount must be a number");
    }
  },
);

export const userProfileModel: ModelSpec<UserProfile, PersistedUserProfileV2> = defineModel<
  UserProfile,
  PersistedUserProfileV2
>({
  currentVersion: 2,
  toPersisted: (domain) => ({
    schemaVersion: 2,
    displayName: domain.displayName,
    loginCount: domain.loginCount,
  }),
  fromPersisted: (persisted) => ({
    displayName: persisted.displayName,
    loginCount: persisted.loginCount,
  }),
  migrations: {
    1: (persisted: PersistedUserProfileV1): PersistedUserProfileV2 => ({
      schemaVersion: 2,
      displayName: persisted.name,
      loginCount: 0,
    }),
  },
  validatePersisted: assertPersistedUserProfile,
});
