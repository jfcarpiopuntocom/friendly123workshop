import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.WORKSHOP_URL || "http://127.0.0.1:4173/index.html";
await fs.mkdir("artifacts", { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of [
    ["desktop", { width: 1365, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    await page.route(/fonts\.googleapis|fonts\.gstatic|workers\.dev|googleapis/, (route) => route.abort());
    const response = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 20000 });
    assert.ok(response && response.ok(), `${name}: index did not return HTTP success`);

    await page.waitForTimeout(700);

    const title = await page.title();
    assert.match(title, /friendly-123/i, `${name}: wrong title`);

    const bodyText = (await page.locator("body").innerText()).trim();
    assert.ok(bodyText.length > 100, `${name}: UI looks blank`);

    const visibleButtons = await page.locator("button:visible").count();
    assert.ok(visibleButtons > 0, `${name}: no visible interactive controls`);

    const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
    assert.equal(overlay, 0, `${name}: framework error overlay present`);

    assert.deepEqual(pageErrors, [], `${name}: page errors: ${pageErrors.join(" | ")}`);

    if (name === "mobile") {
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      assert.ok(dims.scrollWidth <= dims.clientWidth + 6, `mobile: horizontal overflow ${dims.scrollWidth} > ${dims.clientWidth}`);
    }

    await page.screenshot({ path: `artifacts/v449-workshop-${name}.png`, fullPage: true });
    await context.close();
  }

  console.log("WORKSHOP UI SMOKE OK: real docs/index.html passed desktop + mobile checks.");
} finally {
  await browser.close();
}
