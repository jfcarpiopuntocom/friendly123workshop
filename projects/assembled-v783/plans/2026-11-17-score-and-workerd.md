# Versioned quality scorecard + real Workerd import validation (2026-11-17)

Notion reservation and full scoped plan: https://app.notion.com/p/41b1642b67f38114af99e1f19810f94b
Base `friendly123workshop/main@932471c77a4e128adffc040e65002901fd8da6ef` (verified at start), workshop code only, **NO customer/production activation**, no existing Worker/index.js or PWA/service worker edit. `projects/assembled-v783` scoped artifacts.
Owner: ChatGPT; all new file paths. Keep other agent reservations untouched.

## Proving progress to >=95/100, not repeating fixed 63

A permanently tracked **100-point engineering confidence index**, an editorial model and **not statistically measured failure probability**, plus strict six independent release gates from Claude/JFC. Seven weighted dimensions fixed here for all future increments:
- Business functions 20 points
- Local durability/idempotence 20
- Cross-device & cold join 20
- Server authorization and commercial safety 15
- Photos and PWA 10
- Migration and rollback 10
- Verified physical 2-cycle evidence 5

The historical Nov10 45.0 score is a **retrospective estimate** anchored in Notion, not a reproducible original CI SHA; uncertainty +/-5 points. Exact source at first snapshot `932471c77a4e128adffc040e65002901fd8da6ef` has provisional 63.5: [17.5,16.0,12.0,7.5,6.0,4.5,0.0] respectively; uncertainty +/-4. Arithmetic, evidence URLs and source SHA must be committed and tested. No points awarded just for green unrelated tests or creating another helper. Scores can decrease on regression. Release only if >=95 **and** six explicit customer gates have independent evidence; score alone never certifies GO. Mark partial proof `synthetic`, `node-sqlite`, `workerd` or `physical` visibly.
- Real Workerd regression of the new frozen import may earn +0.5 migration after **successful** test at exact SHA, leading to 64.0. No free bump on test creation.

## Test-first Workerd compatibility and cold durability

1. Write RED tests using a *new isolated Workerd fixture* in `relay/injertos/yparty-worker/qa/`, exercising imported `src/certified-frozen-import.mjs` through Miniflare Durable Object `ctx.storage`. Start with missing fixture, RED GitHub Actions (no network).
2. Build a separate tiny fixture DO with `transactionSync`, real SQLite and Yjs update frames, powered by esbuild bundle; public Worker production source untouched.
3. Verify import exact bytes, SHA+vector, 3 opIds; dispose/restart Miniflare preserving storage; export confirms event count and SHA. Child without parent denied and unable to seed. Second history rejected; never overwrite.
4. Write `quality/score-v1.json`, CLI `score.cjs`, assertions `score.test.cjs`: precision 0.1, fixed weights=100, reference SHA, historic source uncertainty, per-axis evidence, six gates, reject unsupported score or false GO; snapshot object on each validated commit and immutable history.
5. Verify focal, native Miniflare, existing integration 585 and suites that run on PR; logs and SHAs. If Workerd test fails, keep score 63.5. If green, set 64.0 with exact CI URL and reason.
6. PR into workshop only. Write evidence/STATUS and Notion. No production work, no user data, no changes to other agents' reserved paths.

## Known limitations

Neither real Firebase frozen HEAD nor 15 unresolved Yjs ancestors repaired by this fixture; no actual import endpoint attached; server central role, typed econ, photos outside Yjs, WebLocks, true physical Opera PC ↔ Safari iPhone A→B→A×2 still unsatisfied. Workshop pages build does not mean app deployed. 29 previous full historical FAIL are reported, not hidden.
