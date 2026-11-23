#!/usr/bin/env node
"use strict";

/**
 * Applies the pre-tested C237 v0.9.09 Safari Anti-Crash + HTTP Cache-Busting Reenganche +
 * BFCache IDB Reset + Lazy Sold kit cleanly on top of friendly-123 origin/master 89850cd1.
 */

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const targetRepo = process.argv[2] || ".";
const patchFile = path.join(__dirname, "..", "releases", "C237-v0.9.09-Safari-AntiCrash-Reenganche-on-89850cd1.patch");

if (!fs.existsSync(patchFile)) {
  console.error("Missing patch file:", patchFile);
  process.exit(1);
}

cp.execFileSync("git", ["-C", targetRepo, "apply", "--check", patchFile], { stdio: "inherit" });
cp.execFileSync("git", ["-C", targetRepo, "apply", patchFile], { stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs", "--check"], { cwd: targetRepo, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs", "--check"], { cwd: targetRepo, stdio: "inherit" });

console.log("C237 v0.9.09 patch applied & verified cleanly on:", path.resolve(targetRepo));
