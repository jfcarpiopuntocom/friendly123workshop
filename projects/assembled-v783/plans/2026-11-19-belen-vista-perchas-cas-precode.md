# PRECODE · P0 Belén · CAS A→B→C (`expectedFotoHash`/`expectedFotoRev`) + ACK estricto en `docs/vista-perchas.js` · 2026-11-19

- **Producto destino:** `jfcarpiopuntocom/friendly-123` (base `origin/master@b28e54a`, `v0.8.03`, tras fusión de #793).
- **Rama candidata (para revisión/fusión de Sol6):** `fix/p0-belen-vista-perchas-cas-v804`.
- **Aislamiento:** CERO colisión con Sol6 #794 (C14) y #795 (C15). NO toca `docs/sync-yjs.js`, `cloudflare-yparty-worker/*`, `docs/sync-rollout.json` ni `docs/engineering/*` (no infla PORT 2.0 `81.5/100` ni GO `0/6`).

## Causa raíz única (Apéndice adversarial Belén #3 y #5)
`docs/mock-backend.js:7001-7012` (PR #777) ya exige coincidencia de `expectedFotoHash` y `expectedFotoRev` y responde `409 PHOTO_POINTER_CONFLICT` cuando se envían. Sin embargo, los **3 escritores** de `PUT /api/ubicaciones/:id` en `docs/vista-perchas.js` (líneas 593, 1043 y 1082) siguen enviando únicamente `{ fotoHash: hash }`, dejando el CAS sin efecto en el flujo real de perchas (una escritura lenta o reintento A→B puede sobrescribir una foto C más reciente). Además, `[data-vault-restore]` (línea 1084) solo fallaba si `rr && rr.ok === false` (aceptando `rr === null` o sin `.ok`) y no verificaba `mismoCuaderno()`.

## Cambio mínimo completo (Ponytail)
1. En `docs/vista-perchas.js`:
   - Capturar `fotoPreimagenPorId[id] = { expectedFotoHash: u.fotoHash || null, expectedFotoRev: u.fotoRev || null }` al cargar `perchasVisibles`.
   - **Escritor 1 (`recuperarFotosPerchas` → `setPointer`):** adjuntar `{ expectedFotoHash, expectedFotoRev }` desde `perchasVisibles` en `PUT /api/ubicaciones/:id`.
   - **Escritor 2 (`inputFoto` change):** capturar preimagen desde `window.OCSync.catalogoPropio()` (o `fotoPreimagenPorId[id]`) antes del `await`; enviarla en el `PUT`; si responde `409`, reportar `'foto-pointer-conflicto'`, conservar bytes locales sin sobrescribir y recargar `cargar()`.
   - **Escritor 3 (`[data-vault-restore]`):** capturar `cuadernoRestore` + preimagen antes del `await`; validar `mismoCuadernoRestore()` antes de mutar `fotoCache`/hacer `PUT`; enviar preimagen CAS; exigir `!rr || rr.ok !== true || !mismoCuadernoRestore()` como fallo estricto.
2. Sellado de shell: `v0.8.03` → `v0.8.04`, `f123-shell-v804`, `golden340` en `docs/sw.js`, `docs/version.json`, `docs/dashboard.html` y `node scripts/gen-manifest.js` (con `bash check-sw.sh`).
3. Pruebas TDD RED→GREEN (`test/p0-belen-vista-perchas-cas-e2e.test.cjs`) probando los 3 escritores reales de `docs/vista-perchas.js` contra el `mock-backend.js` real en escenario A→B→C concurrente + `409` + `vault-restore` ACK estricto/cambio de cuaderno, más regresión de las 3 suites existentes de fotos Belén.

## Rollback y límites
- Revertir PR restaura comportamiento anterior sin tocar datos ni fotos locales.
- No cierra pruebas físicas en iPhone ni cambia el score PORT 2.0 (`81.5/100`) ni GO (`0/6`).
