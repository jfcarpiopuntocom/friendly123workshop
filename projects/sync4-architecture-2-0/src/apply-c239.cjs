#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const targetRoot = path.resolve(process.argv[2] || ".");
const BASE = "94818f172867facd4aac93c354b3f5dadb9ce7bf";
const head = cp.execFileSync("git", ["-C", targetRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== BASE) {
  console.error(`Expected HEAD=${BASE} (v0.9.09), got ${head}`);
  process.exit(1);
}
const status = cp.execFileSync("git", ["-C", targetRoot, "status", "--porcelain"], { encoding: "utf8" }).trim();
if (status) {
  console.error("Working tree must be clean before applying C239.");
  process.exit(1);
}

const patchPath = path.resolve(__dirname, "..", "releases", "C239-v0.9.10-Safari-AntiCrash-IDB-Watchdog-on-94818f17.patch");
if (!fs.existsSync(patchPath)) {
  console.error("Missing C239 patch:", patchPath);
  process.exit(1);
}
cp.execFileSync("git", ["-C", targetRoot, "apply", "--check", patchPath], { stdio: "inherit" });
cp.execFileSync("git", ["-C", targetRoot, "apply", patchPath], { stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs", "--check"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs", "--check"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/release-control.cjs", "validate", BASE], { cwd: targetRoot, stdio: "inherit" });
console.log("C239 (v0.9.10 / f123-shell-v910 / golden446) applied & validated cleanly on:", targetRoot);
