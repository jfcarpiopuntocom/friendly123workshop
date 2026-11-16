# P0 · atomic validation of rack edits — implementation plan
> **For agentic workers:** Follow Superpowers test-driven-development and executing-plans, Ponytail full. Continue in the GitHub branch, not production.

**Goal:** A rejected PUT /api/ubicaciones/:id must never partially change a location in memory or disk.

**Architecture:** Keep the existing endpoint and native browser fixture. Move all rejecting numeric/compatibility validation ahead of all mutations; no new persistence engine, no receipt/role/sync changes. Separate from PR #39, which addresses false durable ACK on rack POST.

**Tech stack:** Existing JavaScript browser mock-backend, Playwright Chromium/WebKit, locked npm dependencies.

**Spec:** Existing endpoint behavior in `app/docs/mock-backend.js` around rack PUT and JFC's requirement for reliable commercial data.

## Global constraints
- Work only inside `projects/assembled-v783/` of friendly123workshop.
- Production `friendly-123` untouched; no customer data, actual license, PIN, remote relay or deploy.
- Use existing `test/tab-session-handoff.test.js` helpers and blocked-network preload.
- Check actual SHA/tests before claiming success; no merge without whole regression/full audit.
- PR #39 concurrently edits rack POST; rebase carefully after PR #39 integrates.

## Review focus
- Invalid percentage after name mutation (must be atomic).
- Invalid tiered contribution after name mutation (must be atomic).
- Existing valid rename/commissions unchanged.
- Restart/cold read does not see rejected values.
- Distinguish this 400 validation bug from 2xx false ACK of valid PUT, which is separately unsolved.

### Task 1: RED real-browser rejection test
**Files:** modify `app/test/tab-session-handoff.test.js`; new CI workflow `.github/workflows/v783-rack-put-validation-tdd.yml`.
- [ ] Append test using existing `seed(ctx)`, ownerLogin, and `api(page)`: PUT invalid `pctQuedaEnCasa:101` with a valid `nombre` and `comisionSocio`, expect 400 and original name/commission in subsequent GET (plus cold read).
- [ ] Check RED in official Chromium and WebKit CI with no-production-network preload. Failure must show change in memory despite 400; harness failures don't count.
- [ ] Add contribution-vs-tiers rejection case if one corrects without another.

### Task 2: minimal GREEN
**File:** modify `app/docs/mock-backend.js`, ONLY rack PUT preflight.
- [ ] Compute validation errors for `comisionSocio`, `pctQuedaEnCasa`, and `contribFija`/escalas before first field assignment. Preserve existing error strings/status.
- [ ] Do not duplicate validations later or change non-rack operations.
- [ ] Repeat the exact RED tests: Chromium and WebKit PASS; valid rack edits unchanged, cold readback intact.
- [ ] Reseal only the actual changed mock-backend hash in `docs/version-manifest.json` using pinned generator; compare all shell assets byte-for-byte.
- [ ] Run integrated financial/roles/stock/photos suite, then full candidate-versus-baseline and report remaining failures.

### Task 3: peer review / merge gate
- [ ] Compare source diff with `main` and PR #39; don't overwrite its rack POST commit.
- [ ] Preserve log names, SHA and numbers in `reports/2026-11-16-rack-put-validation-atomic.md` and living Notion.
- [ ] Only after full review and passing gates, merge to workshop main (never production).
