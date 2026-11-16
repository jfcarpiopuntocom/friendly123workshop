# Assembling rack PUT prevalidation on top of verified rack POST CAS — continuation plan

> Superpowers TDD/executing-plans, Ponytail full. Workshop only. Plan is durable before editing any runtime. No production deploy.

**Goal:** Combine [PR #39](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/39) (already merged as `a8b351ad2f97c0bbc3600357b618c1b4ef1d003c`) and [PR #40](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/40) (RED→GREEN on an older main) without dropping either change.

**Source of truth:** `projects/assembled-v783/app/docs/mock-backend.js`, existing tests `app/test/tab-session-handoff.test.js`, shell `docs/version-manifest.json`. Base SHA **a8b351ad2f97c0bbc3600357b618c1b4ef1d003c**, new isolated branch `fix/v783-rack-put-after-cas-20261116`.

## Proven evidence before this rebase
- PR39 original RED was false 2xx rack POST with both stores failing; PR39 final rack quota+concurrent CAS **4/4 Chromium/WebKit PASS** and integrated **585/585**, independent logs [43955165097](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43955165097), [43955165082](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43955165082).
- PR40 RED on old main: PUT 400 mutated `nombre` in both browsers, [43953443734](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43953443734); prior isolated fix/third-cold-reader GREEN **2/2**, [43954784965](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954784965), and integrated **585/585** [43954785668](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43954785668).
- These two successes are on **different trees**. They do not certify their combined runtime. No false GO.

## Tasks — run in order
1. [ ] Read base main POST, PUT, save/rollback and tests; copy only the narrow prevalidation from PR40 into main's PUT. **Keep PR39 source byte-identical outside PUT** (not least its post-create save/rollback, CAS rebase, quota 507). Record this as the main reconciliation criterion.
2. [ ] Append PR40's exact native Chromium/WebKit PUT regression to main's existing `tab-session-handoff.test.js`, retaining all PR39 POST/CAS tests. Require invalid house-share AND incompatible tiers 400 with no mutation; cold third tab must not resurrect data; valid 15% house share is accepted.
3. [ ] Install a minimal PR workflow invoking both PUT and POST+CAS focused suites using existing fixtures, no external production networks, and archive results on fail. Run both in same browser test runner, no skip. Test must be RED if the prevalidation is deleted.
4. [ ] Update **only the actual new mock-backend SHA256** in `docs/version-manifest.json` from the GitHub Actions SHA256 digest. No shell/SW changes.
5. [ ] Verify new SHA: focal combined native WebKit/Chromium **6/6**; expense/hash and credit-money; integrated business/authority/relay QA **585/585**; run full candidate-vs-baseline audit and state inherited reds honestly. Independent diff review before merge; no customer/publish GO.
6. [ ] Save exact passes/fails, SHA, CI run IDs and remaining gates to `reports/2026-11-16-rack-put-post-cas-integration.md`, PR and living [Notion](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902). Keep the old PR40 for immutable historical RED→GREEN and mark superseded only after the combined replacement lands.

## Constraints and risk
- No new dependency, abstraction or engine; use existing save and validation.
- Never equate successful local IDB ACK with peer/cloud or commercial ACK.
- Do not change sales, money, photo, role, customer, ledger, or PWA.
- PR39's strict POST can interact with existing background saves; retain native CAS/quota tests.
- Non-strict **valid PUT/DELETE** still return early without durable confirmation: **NOT fixed by this plan**; separate TDD P0.
- Real mobile A→B→A×2, broad role authorization and full legacy `npm test` are still NO-GO. Workshop main is safe for isolated candidate testing only.
