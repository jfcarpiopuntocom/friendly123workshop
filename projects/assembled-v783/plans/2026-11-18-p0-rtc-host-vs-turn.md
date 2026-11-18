# P0 dashboard v787 — differential WebRTC host-vs-TURN (18 Nov 2026)

**Owner request:** focused Superpowers systematic debugging, test before production, Ponytail minimal changes, and durable evidence. Current live dashboard lacks verified PIN/business-data acceptance.

**Observed RED:** prior isolated [live TURN-only CI](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44335923862) exchanged SDP offer/answer through the deployed Worker, but collected ZERO relay candidates, emitted ICE error 701 (host lookup/allocate timeouts), and timed out 70s. [PR #760](https://github.com/jfcarpiopuntocom/friendly-123/pull/760) restored metadata relay-candidate acceptance; relay-candidate acceptance is NOT sufficient for real connection.

**Differential hypothesis (not assumed true):** signaling and peer WebRTC code work over host candidates; public TURN provider/network is the remaining blocker to cross-NAT. A host-only trial with no STUN/TURN separates signaling/RTC logic from external provider availability. If host-only remains RED, investigate adapter/worker; if GREEN, investigate DNS/server reachability/credential separately. Remote TURN hostname lookup errors can be runner-specific; do not infer universal outage.

**Contract:** same production peer-sync.js and deployed Cloudflare signaling Worker, random isolated room, two isolated Chromium contexts, empty ICE server list and forced host-only via no STUN/TURN; nominated local candidate must be host; binary 4-byte payload must arrive byte-identical. No PIN, license, business data, account credentials, persistent store, customer traffic or production source changes. No signal payload may contain business bytes.

**Execution:** copy the existing tested TURN-only fixture to a standalone host-only fixture, change only ICE setup + asserted candidate type; run a dedicated GitHub Actions Node22 Chromium job, preserve full failure diagnostics without secrets. This is a diagnostic gate, not a release GO. Record exact SHA and CI outcome in Notion and workshop. Rollback = remove this QA branch; no runtime changed.

**State:** fixture/CI pending; this note precedes code.

## Verified outcome · 18 Nov 2026 · exact CI

**GREEN (native real Chromium):** [workflow 44342616469](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44342616469), job `134936385382`, fixture head `936faccf6c186744ce384e39994003a1e4487118`. Browser A and browser B exchanged RTC SDP through the LIVE Cloudflare Worker, each selected nominated candidate `host`, exact 4-byte synthetic payload reached receiver. Node test 1/1 PASS, 0 FAIL. Test-only workshop [PR #125 merged](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/125) as `d27a01f9d7ce5db2ad3ed2f5429f3ed0bb42c4b9`.

**RED (external TURN):** [workflow 44335923862](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44335923862). Identical code/Worker with forced `relay` policy exchanged SDP correctly but produced no TURN candidate; two endpoints reported ICE 701 host lookup and TURN allocate timeout. This establishes TURN failure for the tested runner/network, not universal unavailability.

**P0 status:** direct RTC transport works on two Chromium contexts in the same GitHub Actions runner. External TURN cross-NAT and dashboard PIN→Owner→full commercial report remain unverified. Published app/Worker unchanged by QA-only PR.
