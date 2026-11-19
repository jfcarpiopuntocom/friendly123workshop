# Belén / H2 · next Ponytail v0.8.02 · vault-restore phantom ACK

## Dependency and source owner
- Sequence: v800 (#776) fixes automated recoverShelfPhoto adapter; v801 (#777) adds optional shelf backend CAS. Do not start this UI change until #777 merges / stable is observed and `docs/vista-perchas.js` is unreserved. One owner and isolated branch.
- Source actual `docs/vista-perchas.js` delegated click handler:
  `const vr = e.target.closest && e.target.closest('[data-vault-restore]');`
  `const rr = await fetch(..., PUT ...);`
  `if (rr && rr.ok === false) throw...`; then `cargar()`.
- This allows `null`, response missing `.ok`, or stale reply from another shop to be interpreted as restored. Distinct from #776 `recoverShelfPhoto` adapter, which correctly checks `!!rr && rr.ok === true`.

## Red-first executable acceptance
- Extract exact handler block from source and execute its function with isolated synthetic elements/photo bytes.
- RED 1: `fetch` returns `null`: no reload as success, warning/alert; per-id photo bytes preserved.
- RED 2: returns `{status:500}` without `.ok`: same.
- RED 3: change notebook after `leerPorHash` resolves: zero PUT old shop; no client photo loss.
- RED 4: change notebook during pending HTTP response: no success refresh.
- GREEN: explicit `{ok:true}` same shop loads once; `{ok:false}` fails without deleting bytes.
- Not a durability solution for lost ACK: bytes are stored locally but no secure retry of pointer until same-shelf CAS and IDB intent.

## Minimal patch
Capture notebook key before await; at each async step ensure same non-empty shop identity. Strict HTTP reply `rr && rr.ok === true`. Do not claim `guardarFoto` success if it returns false. No new unconditional PUT replay. Preserve IDB photos and visible old link. Respect role restrictions and existing H2 regressions.
- Release: next shell802 golden338, version v0.8.02 via official build/gen-manifest, no direct manual hash; Node/Chromium/WebKit gates exact SHA, then merge with expected HEAD and verify stable/public.
- This is a planned suggestion, not yet implemented.
