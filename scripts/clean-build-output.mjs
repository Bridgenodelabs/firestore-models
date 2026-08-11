import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { STUB_ROOT_DIRECTORIES } from "./subpaths.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const target of ["dist", ...STUB_ROOT_DIRECTORIES]) {
  rmSync(join(repoRoot, target), { recursive: true, force: true });
}
