# C93 PRECODE · Forward-only witness union of current friendly-123 devices (no historical reconstruction)

20 Nov 2026. Target **SAME** `jfcarpiopuntocom/friendly-123` master `082a270b0a609405a3c7aa1f2a6dc99f94985b7b`. This PRECODE is created before any product code. Scope is independent of concurrent #888/#841 and contains no modifications to Belén's devices, IDB, PWA, Firebase, R2, or Sync3.

## Binding user directive
The user explicitly states that reconstructing historical Firebase/Yjs ancestral data (Nov 4–7/17 writers/3-of-20 fragments) was invented and is UNDESIRABLE, NOT REQUESTED, NOT OPTIONAL. Stop that work. The user wants **observe current iPhone + dashboard + current shop devices, unite with no loss, seal forward**, never alter originals. Do not make their devices' present facts lose to an old Firebase snapshot. Do not issue destructive imports/reset/purge/PIN rotate.

## Specific code gap from real product
`src/yparty-piloto.js` `crearCoordinadorCorte20` and `src/port2-cross-device-failback.mjs` require an authenticated `expectedFrozenHead` and certified -cat session for activation; `cloudflare-yparty-worker/src/index.js` expects a trusted frozen source under QA. Neither currently implements a testable union of **independently observed PRESENT** facts from Belén's devices. DO NOT bypass that security gate by inventing a head or booting an empty room.

## C93 minimal independently auditable increment
Add a PURE, no-IO, no-data-mutation forward-current union planner using stable `Sha256Sync` in `cloudflare-yparty-worker/src/current-state-union.mjs`; add source-executed RED→GREEN tests in `cloudflare-yparty-worker/qa/p0-c93-current-state-union.test.mjs`, plus small isolated GH workflow. This is a functional code foundation for the PRESENT seal, not a fake completed cutover, not a browser export, not a history retriever.

Expected contract:
- Input an array of **read-only observations of current friendly-123 state**: strict app identity `friendly-123`, same 64-hex business scope, unique 64-hex source IDs, array of economic facts `{opId,payload}` and array of current view witnesses `{domain,keyHash,valueHash}`. Sources can represent iPhone Safari/PWA, dashboard or desktop; dashboard may be view-only (zero facts).
- Canonical payload JSON, finite financial numbers only, bounded size/depth; deny secrets and malformed inputs. Content-hash every opId payload, preserve provenance by source. If same opId+same payload across devices, deduplicate. If same opId with different payload, quarantine both (preserve values, NO winner), even if amount differs by a cent. Views may disagree and must be marked unresolved, not overwritten; physical stock views are NOT inventory movement events or an instruction to `set stock=N`.
- Pure synchronous result `{sealed:false, readyForAuthenticatedSeal:boolean, facts, quarantined, observations, viewDifferences, digest}`, no IO, no network, no write, no SW/PWA/cache operations. Show readiness only if >=2 distinct sources, at least one device fact source, and zero conflicts; this is **candidate readiness only**, not commercial GO.
- Never request old Yjs ancestor fragments or historical Firebase HEAD. The later authenticated service must separately prove current owner role, source consent, durable server write and exact ACK before activating 2.0; this PR doesn't change worker routing/flags.

## Tests RED-first then GREEN
1. Three sources with two identical opIds across device+Firebase and one browser-only financial fact => union fact 3 distinct, provenance correct; two snapshots of same view no disagreement.
2. Same opId/changed amount => both versions retained in quarantine; not sealable; original arrays unchanged.
3. Source contamination by `amigable-123` or `consultorio-123`, mismatched scope, duplicated source id => reject.
4. Two current witness hashes disagree => differences recorded and not sealable, not pick latest timestamp.
5. Deep/oversized/untrusted/NaN/Infinity/secret payload rejected; output immutable independent from inputs.
6. No external requests, no filesystem/IDB mutation (pure helper).
7. Real GH C93 workflow runs `npm ci --ignore-scripts --no-audit --no-fund` and native Node tests in worker subproject.

Acceptance: only merge with CI complete SUCCESS and readback source on master; keep official original100 scores PORT 92.0, quality80.4, GO0/6, physical0/5 until a proven new rubric milestone. Report Notion + workshop and handoff **explicitly** remaining wiring to owner-authenticated PRESET CURRENT seal, not to a history importer.
