# P0 Belén H6 v798 · test-run + minimal safe integration on published v797

## State / ownership
- Main master=estable dfa81fb9379e5b166d8072fd7613367c3d90c7a3, v0.7.97 shell797 golden333, merged PR #773. Cloudflare production build success, served Pages URL /version.json pending independent check.
- H6 original PR #769 is DRAFT, head bbedf177b4b24ca972ae3d3feb7b45cda0462021 from older v793, maintained by another AI. **Do not edit PR #769 branch or overwrite newer dashboard code.** Build integration branch from current master and cherry-pick minimal H6 hunks, citing provenance.
- Belén reports difficulty reconciling actual event/bar gross, cash and commission, and Casa totals; corrupt/incomplete financial facts must not be shown as complete. This fix does NOT create missing facts, migrate old unscoped DB, perform a settlement, or assert her money amounts.
## RED and causal requirement
- Existing live `src/dashboard/dashboard-main.js` currently treats successful IDB read transaction as coverage complete even when hash chain has gaps or tampering. Original H6 #769 has real-source RED tests for edited amount and missing predecessor, plus validity and no WebCrypto tests.
- Add existing H6 tests and pure validator from old PR to isolated integration branch. Verify first RED against current unchanged src/dashboard; ensure failing behavior is exactly coverage accepted on invalid chain, not harness crash.
- Additional stale-session race: original #769 `.catch()` after async hash lacks `_hechosSesionVigente()`; regression that switches notebook while verifier rejects must show no repaint/new session leak. Add RED and guard to eventual minimal production patch.
## Minimal code
- Pure `docs/core/hechos-chain-readonly.js` from #769, with parity to `docs/hechos.js` legacy and WebCrypto SHA256; read-only no I/O. Add to dashboard.html AFTER connection scripts and BEFORE dashboard-main bundle.
- Exactly two localized hunks in `src/dashboard/dashboard-main.js`: status `sin-verificador`/`cadena-invalida` messages; async verify ALL finance journal facts before marking `hechosFinancieros` complete, session generation guards in resolve and reject.
- Update two existing H1 tests to use valid synthetic chains and load real verifier in harness. Include original #769 negative and parity + Chromium/WebKit. No migrations, no writes, no changes to financial calculation formula or other agents' files.
- Release v0.7.98 / `f123-shell-v798` / `golden334`; official dashboard asset build, gen-manifest, version identity, release-control. One-shot build workflow on branch if GitHub container access only; remove workflow before final SHA.
## Gates / release
- TDD: RED on exact source, GREEN with unchanged parity; browser Chromium + WebKit; PIN/owner switch, no ghost DB, money/stock/Sync3 and official manifest+Cloudflare required check on exact candidate SHA.
- Only squash merge with expected exact HEAD and required Cloudflare Workers Builds check. Keep `master`/`estable` identical (non-force CAS) and verify official origin. Stop if any security or money regression fails.
- Properly label implemented vs integrated vs published vs device UAT. Physical PC↔Safari causal convergence remains separate P0 after H6; avoid unsupported claims about Belén's cash figures.
