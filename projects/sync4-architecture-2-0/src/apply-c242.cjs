#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const targetRoot = path.resolve(process.argv[2] || ".");
const BASE = "4a6d038f7e8230e90036e543671fde987bb65ad5";
const head = cp.execFileSync("git", ["-C", targetRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== BASE) {
  console.error(`Expected HEAD=${BASE} (v0.9.11), got ${head}`);
  process.exit(1);
}
const status = cp.execFileSync("git", ["-C", targetRoot, "status", "--porcelain"], { encoding: "utf8" }).trim();
if (status) {
  console.error("Working tree must be clean before applying C242.");
  process.exit(1);
}

const patchPath = path.resolve(__dirname, "..", "releases", "C242-v0.9.12-Safari-IDB-Watchdog-F123-Namespace-on-4a6d038f.patch");
if (!fs.existsSync(patchPath)) {
  console.error("Missing C242 patch:", patchPath);
  process.exit(1);
}
cp.execFileSync("git", ["-C", targetRoot, "apply", "--check", patchPath], { stdio: "inherit" });
cp.execFileSync("git", ["-C", targetRoot, "apply", patchPath], { stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs", "--check"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs", "--check"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/release-control.cjs", "validate", BASE], { cwd: targetRoot, stdio: "inherit" });
console.log("C242 (v0.9.12 / f123-shell-v912 / golden448) applied & validated cleanly on:", targetRoot);
