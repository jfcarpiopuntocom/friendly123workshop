# C92 PRECODE — Rubrica original100, tres fuentes REALES integradas, calidad 80.1→80.4; transición 92.0 permanece

**Fecha:** 2026-11-20. **Autor:** Sol6. **Estado:** PRECODE — escrito ANTES de editar score/tests del producto. **Producto:** `jfcarpiopuntocom/friendly-123` master `a2c178081fe9b4e918d186a9ffa5012d0a6d7c6c`.

## Decisión, evidencia y rúbrica inmutable

No crear nueva app ni segundo «port». Mismo producto 1.0→2.0; Sync3 ya 2.0 preservado. Workshop exclusivamente plan/QA/evidencia. Dos métricas independientes, con 1 decimal y presupuesto fijo 100.

**Score A — PORT de la MISMA app:** `92.0/100.0` → `92.0/100.0` porque faltan exactamente 8.0: Firebase HEAD histórico económico completo2.0; R2 Service Binding2.0; operacional/físico4.0 (incluye `browser-photo-cutover`1.0 con aparato real aún no probado). NO marcar browser-photo-cutover como done por meras pruebas VM UI. `GO 0/6`, `Opera↔Safari/PWA 0/5` intactos.

**Score B — CALIDAD arquitectónica, 100 pesos ORIGINALES:** `80.1/100.0` → candidato `80.4/100.0`, +0.3 solo por fuentes funcionales ya MERGED y probadas con GIThub Actions:
1. **Durability18.6→18.7/20, +0.1** por [C70 #871](https://github.com/jfcarpiopuntocom/friendly-123/pull/871) MERGED SHA `a94445d5a7efb157917a3cc209f69426b9667433`: protege causalidad Yjs para unión a -ops ocupada en misma transacción DO SQLite, persiste vectores, detecta fake/stale y acepta alta+baja válida post-corte. CI HEAD 18 successes +1 skip (test RED→GREEN fuente).
2. **Photos7.7→7.8/10, +0.1** por [C68 #868](https://github.com/jfcarpiopuntocom/friendly-123/pull/868) MERGED SHA `a2c178081fe9b4e918d186a9ffa5012d0a6d7c6c`: UI `docs/vista-perchas.js` recupera bytes SHA exactos a partir de `OCYjs.fotoSha`/`fotosRefs`, `docs/sync-yjs.js` activa `sembrarFotos()` solo cuando `corteFotosShaActivo` y reinicia presupuesto de lectura por autenticación. CI 66 successes+1 skip; browser UI real en source + VM/Workerd QA, NO físico.
3. **Migration7.8→7.9/10, +0.1** por [C90 #890](https://github.com/jfcarpiopuntocom/friendly-123/pull/890) MERGED SHA `fc139809784880f1f9250c05b946bdb0fda1280d`: lector certificado acepta JSON array `/k` de Firebase real (huecos no inventados), prueba RED→GREEN y lectura real autenticada `-ops` 153 frames/227 opIds; `-y` incompleto sigue FAIL CLOSED, no certificar HEAD completo. CI HEAD 14 successes+1 skip.
**Original quality dimensions** Business19.0/20, Durability18.7/20, Sync15.9/20, Security11.1/15, Photos7.8/10, Migration7.9/10, Physical0.0/5; suma80.4/100. `previous` por dimensión representa justo el anterior score80.1: Business19.0 Durability18.6 Sync15.9 Security11.1 Photos7.7 Migration7.8 Physical0.0.

## Archivos reservados y alcance
Solo `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs` en rama nueva `port2/20261120-c92-three-merged-quality80p4`. No tocar `docs/version*.json`, `docs/sw.js`, `docs/sync-yjs.js`, `docs/vista-perchas.js`, `cloudflare-yparty-worker/src/merge-frozen-into-existing.mjs`, `tools/firebase-rest-reader.mjs`, fuente #888, ni código de otras IA. Reservas activas #841, #888, #891. No cerrar la PR #891 hasta verificado protocolo REST `shallow+ETag` real y conservar todas las fuentes aparatos.

## Fases TDD y gates
1. RED test-only C92 en rama candidata: asertar score 80.4 y previous80.1, tres dimensiones y evidencias exactas de fuente ejecutable; verificar C30 falla con score80.1 actual, no fallos de infraestructura.
2. GREEN: actualizar JSON de calidad y guards del auditor original100; conservar PORT milestones/weights/score, GO, flags QA, Sync3. Comparación por delta sin redondeos falsos.
3. Verificar 1) `node --test test/p0-architecture-2-port-score.test.cjs` y C30 GitHub Actions sobre SHA final; 2) release-control y CI general incl. browser; 3) merge squash CON expected_head_sha solo si todo verde; 4) lectura master y Cloudflare build/deploy SHA postmerge; 5) Notion relevo y reporte workshop con pruebas y SHA.
**Seguridad:** ni una escritura a Firebase, R2, IndexedDB de cliente, SW adicional, PIN, licencia, o activación 2.0 por esta PR. Ninguna puntuación de port se crea por CI sintético.
