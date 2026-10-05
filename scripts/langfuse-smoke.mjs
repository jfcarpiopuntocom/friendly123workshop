import assert from "node:assert/strict";
import { startActiveObservation } from "@langfuse/tracing";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

assert.equal(typeof startActiveObservation, "function");
assert.equal(typeof LangfuseSpanProcessor, "function");
assert.equal(typeof NodeTracerProvider, "function");

const hasKeys = Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
if (!hasKeys) {
  console.log("LANGFUSE REMOTE SMOKE SKIPPED: credentials not configured. SDK import/API surface is OK.");
  process.exit(0);
}

const processor = new LangfuseSpanProcessor({ exportMode: "immediate" });
const provider = new NodeTracerProvider({ spanProcessors: [processor] });
provider.register();

try {
  await startActiveObservation("v449-workshop-smoke", async (span) => {
    span.update({
      input: { fixture: true, release: "v449 WORKSHOP" },
      output: { status: "ok" },
      metadata: { containsRealCustomerData: false }
    });
  });
  await processor.forceFlush();
  console.log("LANGFUSE REMOTE SMOKE OK: synthetic v449 WORKSHOP trace flushed.");
} finally {
  await provider.shutdown();
}
