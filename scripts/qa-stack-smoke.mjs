import assert from "node:assert/strict";
import fs from "node:fs/promises";

const { chromium } = await import("playwright");
const { Sandbox } = await import("e2b");
const tracing = await import("@langfuse/tracing");
const { LangfuseSpanProcessor } = await import("@langfuse/otel");
const { NodeTracerProvider } = await import("@opentelemetry/sdk-trace-node");

assert.equal(typeof chromium.launch, "function", "Playwright chromium unavailable");
assert.equal(typeof Sandbox.create, "function", "E2B Sandbox API unavailable");
assert.equal(typeof tracing.startActiveObservation, "function", "Langfuse tracing API unavailable");
assert.equal(typeof LangfuseSpanProcessor, "function", "Langfuse OTel processor unavailable");
assert.equal(typeof NodeTracerProvider, "function", "OpenTelemetry NodeTracerProvider unavailable");

await fs.mkdir("artifacts", { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.setContent(`
    <!doctype html>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <button id="counter" type="button">0</button>
    <script>
      document.querySelector("#counter").addEventListener("click", (event) => {
        event.currentTarget.textContent = String(Number(event.currentTarget.textContent) + 1);
      });
    </script>
  `);

  await page.locator("#counter").click();
  assert.equal(await page.locator("#counter").textContent(), "1");
  assert.deepEqual(pageErrors, []);
  await page.screenshot({ path: "artifacts/v449-workshop-browser-smoke.png", fullPage: true });
} finally {
  await browser.close();
}

console.log("QA STACK SMOKE OK: Playwright + E2B SDK + Langfuse SDK + OTel imports; browser interaction passed.");
