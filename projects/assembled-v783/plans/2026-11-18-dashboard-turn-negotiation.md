# P0 Dashboard / TURN negotiation — plan before runtime

> **For implementers:** Superpowers systematic-debugging → TDD RED → Ponytail minimal patch → GREEN → verification-before-completion. Use focused tests; do not turn source inspection into a claim that the end-to-end dashboard is working.

**Goal:** Allow the existing licensed, PIN-protected dashboard to complete WebRTC via TURN when direct connectivity fails. Preserve current UI and notebook.

**Baseline:** LIVE master `a2761d9f6f184d96c4f84cf43da300a49bfd7a46` (v0.7.86). In `docs/peer-sync.js:337`, the ICE callback refuses candidate.type=`relay`, even though `F123Ice.build()` configures TURN. The deployed Cloudflare `friendly123-sync-relay` Worker validator refuses `typ relay` (`cloudflare-sync-relay/worker.js:23–36`), confirmed through Cloudflare /content/v2 in the correct account. Thus the fallback is broken at **two independent boundaries**.

**Not proved:** Whether this alone causes JFC's observed dashboard failure. JFC reproduced the failure even in a private window with the app open. A fresh HTTP response for dashboard.html is v0.7.86, while an older browser tab showed v0.7.82. The text-only correction is NOT an acceptance test.

**Approval/immutability:** Keep current UI, PIN checks, licence room identity, YParty OFF, sales outbox, data, inventory, money, photos and old relays unchanged. No production deployment without focused verification, independent security review of signalling metadata and rollback evidence. Do not ask JFC to purge browser storage or execute tests.

## Focused change contract

1. **RED** against actual source: a synthetic, valid TURN ICE candidate must be accepted by the server `validSignal` and emitted by the client `pc.onicecandidate`; invalid types/addresses and end-of-candidates must still be rejected or ignored.
2. **GREEN** in exactly two existing source files: change the strict ICE allowlist in `cloudflare-sync-relay/worker.js` to also accept `relay`; remove the `candidate.type !== 'relay'` suppression in `docs/peer-sync.js`, retaining null/empty guards.
3. Run focused Node tests against real source (not a retyped implementation), dashboard login & WebRTC contracts, and any related security validations.
4. For the UI release, check that exact docs bytes, generated assets, manifest and SW shell are consistent. Never just edit docs/ on production master.
5. For the Worker, obtain an exact deploy/rollback record and prove the intended version is running before calling the path repaired. No silent global change.
6. Run an automated TURN-only two-browser PIN + snapshot scenario with synthetic licence and wrong-PIN denial before claiming **dashboard fixed**. If unavailable, mark hardware acceptance UNKNOWN and live **NO-GO**.

## Alternatives not ruled out

- TURN endpoint could be unreachable; ICE negotiation might fail for another reason; signalling roster may be stale; PIN consumer could be absent; app/dashboard room derivation might disagree.
- `docs/dashboard.html` imports `docs/peer-sync.js` and `dashboard-main.min.js`; source-only dashboard tests do not confirm deployed compiled bytes.

## Evidence ledger

- CODE bug: confirmed at both ends from GitHub and deployed Cloudflare source.
- RED/ GREEN test: pending.
- Review: pending.
- Production dashboard success: NOT CONFIRMED.
- Do not award acceptance points until all required evidence is attached.

**Next step:** reproduce RED in isolation, then prepare a reviewable draft rather than an unverified release.


## 18 nov 10:08 Ecuador · ejecución verificada

- User instruction globally persisted in workshop main `AGENTS.md` commit `2822544267c8a65d181016143a00d05260c8875e`, `CLAUDE.md` commit `3d670df8d4880161dc05a339862c6dfcd24df7a1`: evidence-first, concise, P0 focus, no defensive justification.
- LIVE isolated draft PR [#760](https://github.com/jfcarpiopuntocom/friendly-123/pull/760), branch `fix/p0-dashboard-turn-ice-20261118`. Exactly two source changes: `docs/peer-sync.js` emits nonempty ICE `relay` candidates, `cloudflare-sync-relay/worker.js` strictly validates `typ relay` as metadata, plus tests and v787 shell+manifest. Customer LIVE remains v786.
- TDD new regression `test/p0-dashboard-turn-ice-contract.test.mjs`, manifest generator cross-check exactly matched computed hashes `peer-sync.js=43765c44a6dfbec9fcff0749292867fcc5b624c9099525a4633a7ff17ce40e94`, `dashboard.html=29cdb804f0184786ccd344be1a32e87a8d4195d4b8e99c06cd0377a516edee7d`.
- GitHub Actions exact SHA `3b69b36768f1a32c4c17d5320c89b97ec022fa3e`: `turn-ice`, `hex-boundary`, `two-tab-sales`, `webkit`, `integrated`, `Release continuity gate`, `browser-parity`, `preack-crash` SUCCESS as seen in check-runs. Some broader workflows still running.
- `seal` failed at `.github/workflows/qa-port2-v785-shell-seal.yml` because it hardcodes v0.7.86 even when a candidate correctly increments to v0.7.87. Keep this failure visible; do not silently suppress the gate. Update or scope that historical seal test only after explicit investigation.
- Signalling Worker LIVE deployment `d32ce026-f5b6-403c-b511-1d3b88bf5f7d` remains old; app+dashboard live TURN path not repaired yet, and the user's reported dashboard E2E is NOT CERTIFIED.
