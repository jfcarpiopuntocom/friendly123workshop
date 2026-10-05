import assert from "node:assert/strict";
import { Sandbox } from "e2b";

assert.equal(typeof Sandbox.create, "function");

if (!process.env.E2B_API_KEY) {
  console.log("E2B REMOTE SMOKE SKIPPED: E2B_API_KEY not configured. SDK import/API surface is OK.");
  process.exit(0);
}

const sandbox = await Sandbox.create();
try {
  const result = await sandbox.commands.run('printf "E2B_V449_WORKSHOP_OK"');
  assert.match(String(result.stdout || ""), /E2B_V449_WORKSHOP_OK/);
  console.log("E2B REMOTE SMOKE OK: isolated sandbox command executed.");
} finally {
  await Promise.resolve(sandbox.kill());
}
