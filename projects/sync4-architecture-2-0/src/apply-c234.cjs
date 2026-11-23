#!/usr/bin/env node
"use strict";

/**
 * Applies the pre-tested C234 Safari Anti-Crash + Crash-Loop Circuit Breaker +
 * Commissions RAW/Arrow completion kit over friendly-123 origin/master 2a9303dc
 * (or runs build-c234-safari-anticrash.cjs cleanly and checks min/app builds).
 */

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const targetRepo = process.argv[2] || ".";
const patchFile = path.join(__dirname, "..", "releases", "C234-Safari-AntiCrash-Commissions-on-2a9303dc.patch");

if (!fs.existsSync(patchFile)) {
  console.error("Missing patch file:", patchFile);
  process.exit(1);
}

cp.execFileSync("git", ["-C", targetRepo, "apply", "--check", patchFile], { stdio: "inherit" });
cp.execFileSync("git", ["-C", targetRepo, "apply", patchFile], { stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs", "--check"], { cwd: targetRepo, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs", "--check"], { cwd: targetRepo, stdio: "inherit" });

console.log("C234 Safari Anti-Crash + Commissions patch applied & verified cleanly on:", path.resolve(targetRepo));
