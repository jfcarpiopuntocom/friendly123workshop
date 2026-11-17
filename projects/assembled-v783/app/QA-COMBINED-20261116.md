# Combined-main v783 acceptance checkpoint · 2026-11-16

This file intentionally lives in `app/` to trigger the existing browser/authority integration pipeline on the **combined #43+#44** candidate. It makes no runtime or test assertion changes.

Source baseline: workshop main `5cbd966d27e55de4559883a20e40163d96418a3b`. Changes in main:
- Category batch durability and conditional rollback (#43; `c0d3ad08`).
- Revocation Workerd test causal protocol barrier, unchanged authority runtime (#44; `5cbd966d`).

CI target: 585/585 integrated (check actual counts, no skips) and full historical native-browser npm test (log all failures; do not suppress). Historical full was 3157/3218 pass on separate QA branch, therefore **NO-GO** remains regardless of green integration until critical true failures and physical PC → Safari/PWA → PC A→B→A twice with same license/PIN, no lost sales, stock, money or photos.

Canonical detailed plan: `../plans/2026-11-16-combined-main-smoke-go-gates.md`; draft PR #45. Do not touch production, customer data or concurrently edited rack PUT PR #41.
