# PORT 2.0 APP REAL · Gate D5: bounded frozen merge + PITR receipt (2026-11-19)

> Implementation by Sol6; Hermes/OpenCode read-only observer. Required Superpowers: TDD + verification + Ponytail minimum complete. Product is `jfcarpiopuntocom/friendly-123`; workshop only checkpoint and tests. Sync3 kept.

**Base SHA:** `ed983045c7ac834c0fdb63f371f4c3b4f07226e7` (MERGED real-app PR #784). **Evidence:** Hermes [size/PITR/verify report](https://app.notion.com/p/41d1642b67f38119a1fbc7b3188e1f79), previous [union audit](https://app.notion.com/p/41d1642b67f3817abe2fc6920c50dc36). The observer's 23/23 are Node fixture, not Workerd, not the app.

## Design and defaults (Ponytail)

JFC wants port 1.0 → 2.0 in product. Previous Gate D4 merged actual Yjs `-ops` journal, SQL certificate, SHA and per-opId baseline. D5 closes the *uncapped allocation* before Yjs and captures the *pre-mutation* PITR bookmark.

- **Size:** default **12 MiB raw frozen source**, 12 MiB union state, **96 MiB estimated peak** at factor 4 (upper limit; source >12 MiB rejected with no Yjs construction, no SQL writes). Re-check after independent `prepareFrozenImport` (expansion), after reading SQL local (snapshot+journal bytes), and before appending Yjs delta/state. Explicit per-call tighter test-only limits may lower but **never raise production defaults**. Avoid allocating extra copies before guard; reject as early as possible, then re-check before commit.
- **PITR:** call `storage.getCurrentBookmark()` before the transaction and keep its exact opaque value in an optional `pitr_bookmark` column of `f123_frozen_unions`. Null means platform API unavailable and is disclosed in receipt as `pitrAvailable:false`. A true API error is not forged into "available"; fail-closed on bookmark failure. No restoration in app; only user-directed authorized platform administration. Evidence persists as long as certificate; any retention/production policy later requires explicit approval and real Cloudflare backup inspection.
- **Verification:** existing `verifyFrozenUnionReopen` checks source HEAD, certificate SHA, complete local Yjs, all original local+frozen opId payloads and event digest each cold start. Test tampering just the events digest and just the union SHA. No extra full re-export on *every* HTTP request, only cold start.
- **Cat:** keep `-cat` disabled for nonempty shop (avoids leaking PIN, contacts and money). Approved direction: detached *public allowlisted projection* `productos/ubicaciones` as follow-up distinct injerto, private data stays separate encrypted/typed. No raw private `cat` writes.
- **Data/memory caveat:** Test 6112 synthetic frames of ~8KiB >12MiB returns failback before applying. Budget is conservative capacity control, **not staged 48MiB solution**; large historical source requires independently verified staging/compact bounded finalizer.

## TDD tasks

- [ ] Confirm Notion reservations, merge module and `Tienda.onStart` exact master; write this PRECODE to workshop BEFORE edits.
- [ ] Branch `port2/20261119-gated5-pitr-budget` from SHA above.
- [ ] RED new native SQL tests:
   1. 12MiB+ frozen frame refuses **before** `prepareFrozenImport` and leaves no new SQL, cert or journal.
   2. lower runtime test-only `maxWireBytes` fails on tiny source without massive allocation, never relaxes production ceiling.
   3. over-budget resulting union and local+source storage fail; unchanged SQL; no partial cert.
   4. a storage `getCurrentBookmark()=>'bmk-0001'` is invoked before SQL transaction; receipt + certificate survives cold restart; null when API absent; fail-closed on unexpected rejection.
   5. mutate only `events_sha256` / `union_sha256` → verification refuses; valid aftercut event and snapshot onSave still accepted.
- [ ] Real Miniflare Workerd `Tienda.onStart` on `-ops`: occupied SQL 10+100, cold reopen, failure oversized before write, flag OFF, no new private roots. Existing Workerd tests must remain green.
- [ ] GREEN change only `merge-frozen-into-existing.mjs` (plus fixture/testing if required); use BLOB shape guards and pre/post Yjs checks with integer/overflow protection. No changed old-sync/clients, no Cloudflare deploy.
- [ ] PR to real app, SHA pinned; 16+ check runs exact-head SUCCESS. Merge only on GREEN; verify master/readback; add Notion checkpoint & workshop evidence.
- [ ] Do NOT count as verified customer cutover. Separate architecture port completion metric will require inventory of active runtime routes, independent of 61/100 operational rubric and 0/6 GO.

## Security audit

Untrusted `source.frames` may be malformed, Proxy or typed view. Validate frame `byteLength` bounds without iterating bytes before reject; overflow safe. `MAX_FRAME` compatible with previous 4MiB limit in trusted-source; direct merge caller still guarded. API absent → null bookmark, never invented. Async bookmark captured before synchronous transaction, so PITR records a point before candidate commit but other writers might progress between bookmark and commit; merging is restricted to cold `onStart` before serving and SQL transaction serializes actual commit. Backup does **not** prove recoverability until recovery drill.

**Scores unchanged until measured:** prior operational rubric 61/100, quality 67/100, GO 0/6. These are not percentage of active 1.0 code removed.
