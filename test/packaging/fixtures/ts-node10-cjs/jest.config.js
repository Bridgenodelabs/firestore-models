/**
 * Stock ts-jest in CommonJS mode.
 *
 * Deliberately minimal. There is no `transformIgnorePatterns`, no
 * `extensionsToTreatAsEsm`, and the runner is not invoked with
 * `--experimental-vm-modules`. If this fixture ever needs one of those to go
 * green, the package is still wrong — see test/packaging/README.md.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
};
