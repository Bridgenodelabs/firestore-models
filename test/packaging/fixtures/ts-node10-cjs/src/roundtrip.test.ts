/**
 * The release-blocking fixture.
 *
 * TypeScript + CommonJS + `moduleResolution: node10` + ts-jest, importing the
 * `/core` subpath by its public specifier — the exact consumer shape that could
 * not compile against 0.2.0.
 */
import * as pkg from "@bridgenodelabs/firestore-models";
import { createValidator, readDomain } from "@bridgenodelabs/firestore-models/core";
import { getDocumentData } from "@bridgenodelabs/firestore-models";
import { dateFromTimestamp } from "@bridgenodelabs/firestore-models/time";
import { readDocumentDomain } from "@bridgenodelabs/firestore-models/adapters/firebase-admin";

import { userProfileModel, type UserProfile } from "./userProfile";

describe("packaging: node10 + commonjs + ts-jest", () => {
  it("does not collapse the root namespace to { default }", () => {
    // The original probe from the consumer spike. Against 0.2.0 this was
    // exactly ['default'].
    expect(Object.keys(pkg)).not.toEqual(["default"]);
    expect(Object.keys(pkg).sort()).toEqual(["core", "getDocumentData", "time"]);
  });

  it("imports createValidator from the /core subpath as a callable function", () => {
    // The single acceptance test for this release.
    expect(typeof createValidator).toBe("function");
  });

  it("resolves every published subpath", () => {
    expect(typeof readDomain).toBe("function");
    expect(typeof getDocumentData).toBe("function");
    expect(typeof dateFromTimestamp).toBe("function");
    expect(typeof readDocumentDomain).toBe("function");
    expect(typeof pkg.core.createValidator).toBe("function");
    expect(typeof pkg.time.timestampFromDate).toBe("function");
  });

  it("round-trips a document through the model", () => {
    const domain: UserProfile = { displayName: "Ada", loginCount: 3 };

    const persisted = userProfileModel.toPersisted(domain);
    expect(persisted).toEqual({ schemaVersion: 2, displayName: "Ada", loginCount: 3 });

    expect(readDomain(persisted, userProfileModel)).toEqual(domain);
  });

  it("migrates a v1 document on read", () => {
    expect(readDomain({ schemaVersion: 1, name: "Grace" }, userProfileModel)).toEqual({
      displayName: "Grace",
      loginCount: 0,
    });
  });

  it("rejects a document that fails validation", () => {
    expect(() => readDomain({ schemaVersion: 2, displayName: "Ada" }, userProfileModel)).toThrow(
      /loginCount must be a number/,
    );
  });

  it("reads a domain object through the admin adapter", () => {
    const snapshot = {
      id: "user-1",
      exists: true,
      data: () => ({ schemaVersion: 2, displayName: "Ada", loginCount: 3 }),
    };

    expect(readDocumentDomain(snapshot, userProfileModel)).toEqual({
      displayName: "Ada",
      loginCount: 3,
    });
  });
});
