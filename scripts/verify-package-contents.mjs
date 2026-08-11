import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SUBPATHS } from "./subpaths.mjs";

// Every subpath ships a generated node10 stub; these are the only files allowed
// to exist outside dist/ and agents/.
const stubFiles = SUBPATHS.map((subpath) => `${subpath}/package.json`);

const requiredFiles = new Set(["package.json", "README.md", "LICENSE", ...stubFiles]);
const requiredDirectories = ["dist/", "agents/"];
const allowedPath = new RegExp(
  `^(package\\.json|README\\.md|LICENSE|dist/.+|agents/.+|${stubFiles
    .map((file) => file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})$`,
);

const npmCache = mkdtempSync(join(tmpdir(), "firestore-models-npm-cache-"));

let output;
try {
  output = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: npmCache,
    },
  });
} finally {
  rmSync(npmCache, { recursive: true, force: true });
}

const [packResult] = JSON.parse(output);
const files = packResult.files.map((file) => file.path).sort();

const unexpectedFiles = files.filter((file) => !allowedPath.test(file));
const missingFiles = [...requiredFiles].filter((file) => !files.includes(file));
const missingDirectories = requiredDirectories.filter(
  (directory) => !files.some((file) => file.startsWith(directory)),
);

if (unexpectedFiles.length > 0 || missingFiles.length > 0 || missingDirectories.length > 0) {
  if (unexpectedFiles.length > 0) {
    console.error("Unexpected files in package:");
    for (const file of unexpectedFiles) {
      console.error(`- ${file}`);
    }
  }

  if (missingFiles.length > 0) {
    console.error("Missing required files:");
    for (const file of missingFiles) {
      console.error(`- ${file}`);
    }
  }

  if (missingDirectories.length > 0) {
    console.error("Missing required directories:");
    for (const directory of missingDirectories) {
      console.error(`- ${directory}`);
    }
  }

  process.exit(1);
}

console.log("Package contents verified:");
for (const file of files) {
  console.log(`- ${file}`);
}
