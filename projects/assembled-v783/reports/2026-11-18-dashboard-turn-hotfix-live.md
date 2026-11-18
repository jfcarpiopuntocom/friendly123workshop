# 2026-11-18 · LIVE dashboard TURN ICE hotfix · verified release state

## Result
- LIVE repo `jfcarpiopuntocom/friendly-123`: [PR #760](https://github.com/jfcarpiopuntocom/friendly-123/pull/760) merged commit `e01d4755a72eb31eb581856a007718536548df31`. `master` and `estable` exact same SHA; `previo` exact rollback `a2761d9f6f184d96c4f84cf43da300a49bfd7a46`.
- Public [dashboard](https://jfcarpiopuntocom.github.io/friendly-123/dashboard.html) freshly returned HTTP 200 with `dashboard-release=v0.7.87`, `dashboard-shell=f123-shell-v787`. Its linked [peer-sync.js](https://jfcarpiopuntocom.github.io/friendly-123/peer-sync.js) served HTTP 200 and no longer filters candidates `event.candidate.type !== 'relay'`.
- Live Cloudflare metadata Worker `friendly123-sync-relay` deployment `30b3ed13-c2f2-4caf-83c3-e1bc1bd84bde` version `6115184c-9bb1-4faf-aa88-17a267caf385` (v17 100%). The deployed code's strict `validCandidate` allowlist now includes `relay`. Previous version `d32ce026-f5b6-403c-b511-1d3b88bf5f7d` remains rollback. All four bindings unchanged and inherited.
- Release pipeline hotfix [run #44333325333](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44333325333): `probar-y-mover`, `publicar/construir`, `publicar/desplegar` succeeded. Real-browser public `recorrido` checks were running at last observation; revalidate exact outcomes.
- Exact PR candidate `aeb70674122cf9ec93f37abee7abee5b208b4c4b`: 28/29 checks success, 0 failed, WebKit 3-browser queue pending at recorded observation. Earlier code-identical check on `3b69b367` succeeded.
- Source contract: Peer `docs/peer-sync.js` emits nonempty TURN ICE metadata; `cloudflare-sync-relay/worker.js` `validSignal` accepts validated `typ relay` while rejecting business payload; `test/p0-dashboard-turn-ice-contract.test.mjs` asserts both boundaries. Old v786-only shell seal test was repaired to strictly enforce exact monotonic `version/shell/cacheGeneration` increments and SHA/bundle matching. No business schema changed.

## Boundaries of proof
The demonstrated defect (TURN fallback blocked by BOTH client and Worker) was fixed and publicly delivered. The user's original **real PIN-authenticated app↔dashboard snapshot** has not yet been independently observed after hotfix, so report it as UNKNOWN, never as PASSED. The app remains YParty per-shop OFF, all commercial records and PIN unaffected by this code diff. The physical PC↔iPhone×2 gate is not credited.

## Follow-up focus
1. Read GitHub public `recorrido` workflow result on exact hotfix SHA; extract only relevant browser/union-fria outcomes.
2. Reproduce legitimate owner PIN + dashboard snapshot with synthetic license/data and **actual deployed WebRTC signalling** through blocked-host/STUN conditions; verify TURN or log root cause if still broken.
3. If original dashboard still cannot connect, trace peer roster → RTC channel open → encrypted PIN request → app response → snapshot; gather diagnostic events at the exact boundary and fix one verified root cause (Superpowers RED/GREEN, Ponytail).
4. Keep portable migration score criteria unmodified; this hotfix alone is not proof of port 2.0 completion.

## Post-publication evidence 15:21 UTC (10:21 Ecuador)

- Public [release-proof.json](https://jfcarpiopuntocom.github.io/friendly-123/release-proof.json) returned HTTP 200, exact `commit=e01d4755a72eb31eb581856a007718536548df31`, `shell=f123-shell-v787`, `cacheGeneration=golden323`. Public version.json v0.7.87, public dashboard HTML v787 and live peer-sync JS checked.
- [Production hotfix run #44333325333](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44333325333): `probar-y-mover` PASS, `publicar/construir` PASS, `publicar/desplegar` PASS, `recorrido/recorrer` PASS; `recorrido/union-fria` FAIL.
- The **same cold-join FAIL predated the change**: v786 hotfix [run #44311827202](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44311827202) also had `recorrido/union-fria` FAIL, `CANARIO_ERROR_ETAPA: RECUPERACION`, Firebase `pullMas=true`, missing Yjs parents. New v787 canary also fails `RECUPERACION`, with Yjs `pendingStructs/pendingDs=true` and partial Firebase pull. Not a verified regression attributable to TURN fix. It remains a **REAL UNRESOLVED P0**; do not mask with green RTC test.
- Independent **LIVE actual Worker WebSocket proof** from [workshop PR #122](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/122) and [Action #44334546957](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44334546957): random synthetic room, two real sockets, verified roster and forwarded `typ relay` ICE, TAP 1/1 PASS, 0.63 s. PR merged workshop main `d703d6be216937ffc9fcbaf6e30ca36248532b01`. Does not prove real RTC TURN allocation or valid-PIN dashboard snapshot.
- Absolute next blocker: legacy Firebase cold-join progress 28 pages/5348 frames from pre-release, never reaches completed Yjs causal history. Existing port-2.0 gate still requires authority issuer `/ws/ticket` service; separate task with no earned GO points.
