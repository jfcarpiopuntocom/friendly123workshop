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
