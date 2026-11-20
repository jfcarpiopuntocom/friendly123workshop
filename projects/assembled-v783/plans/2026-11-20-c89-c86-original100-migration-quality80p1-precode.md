# C89 PRECODE · Crédito de calidad por C86 económico heredado (20-nov-2026)

## Contexto y alcance
- **MISMA** friendly-123: arquitectura 1.0 → 2.0 mediante injertos OSS maduros. Sync3 ya es 2.0 y queda intacto.
- Producto canónico: `jfcarpiopuntocom/friendly-123`; workshop SOLO planificación, QA, bitácora y evidencia.
- Rúbricas ORIGINALES sin alterar pesos: transición 92,0/100,0 (pendientes 8,0: Firebase HEAD real 2,0; R2 fuente + binding real 2,0; operativo/físico 4,0). Calidad 80,0/100,0 (Business19,0/20; Durability18,6/20; Sync15,9/20; Security11,1/15; Photos7,7/10; Migration7,7/10; Physical0/5).
- 0/6 comercial, 0/5 física; QA OFF; sin despliegues, mutaciones Firebase/R2 ni costes.

## Evidencia fuente real ya fusionada
- [PR #886](https://github.com/jfcarpiopuntocom/friendly-123/pull/886) MERGED a `129e5d45155c4eeb7052c246a5944696f17ce461`, source `cloudflare-yparty-worker/src/frozen-ops-baseline.mjs`: anterior `Number.isSafeInteger` rechazaba `OCSyncEmit('abono', {monto:12.5})` y propiedades `undefined` de producto 1.0, bloqueando el lector económico congelado; actual `Number.isFinite`, valor acotado, -0 canonicalizado, `undefined` objeto omitido. Conserva rechazo NaN/Infinity/rangos grandes y arrays inválidos.
- [QA C86](https://github.com/jfcarpiopuntocom/friendly-123/blob/f9d651ab2ec2c6a5c410d00bc726d5f99591d885/cloudflare-yparty-worker/qa/p0-c86-frozen-ops-legacy-decimals.test.mjs): RED 1/2→GREEN 35/35 local reportado; 13 workflows SUCCESS en head, incluido C86; Workerd DO SQLite cold-open/reopen.
- NO hubo lectura autenticada HEAD Firebase real; herramientas Firebase Codex locales NO expuestas a este chat.

## Propuesta mínima completa: score-only con prueba
1. Rama independiente producto `port2/20261120-c89-c86-migration-quality80p1` desde master SHA fijado. Ningún archivo reservado: no modificar `src/index.js`, `yparty-piloto.js`, fotos (#868), Yjs (#871), ledger (#841), proyección catálogo (#888), Sync3, config/runtime/Cloudflare.
2. RED primero: prueba focal fuente-verificada que exige `quality=80.1`, `previous=80.0`, Migration `7.8/10`, previous `7.7`, previous dimensions sum=80.0, PORT92.0/100.0, GO0/6, físico0/5 y prueba de que C86 real fuente + QA existe. Ejecutar CI RED en SHA test-only; rechazo 80.0!==80.1 es esperado.
3. GREEN: actualizar solo JSON quality `docs/engineering/architecture-2-quality-score.json` (Migration7.7→7.8, previous7.7, score80.1, previousScore80.0, evidencia #886), auditor original `scripts/architecture-2-port-score.cjs` y test original `test/p0-architecture-2-port-score.test.cjs` con referencia a C86 MERGED. Exigir invariantes 100, no mover presupuesto de PORT, y SHA fuente #886.
4. Ejecutar focal y CI global exactas; no fusionar hasta verde completo y lectura posterior. Sin créditos por CI sola a HEAD real, ni activar cutover.
5. Guardar reporte con SHA/CI/NO-GO en workshop y Notion tras resultado.

## Justificación del cambio cualitativo
Rúbrica calidad ingeniería (no probabilidad de falla ni GO). +0,1 *solo* migración porque se elimina un rechazo documentado de datos legítimos del producto 1.0 y se preservan negativas de seguridad; no es nuevo injerto, no se suman hitos falsos de Firebase. Valoración proporcional y revisable. Si las pruebas o auditor fallan, el score queda 80,0.

## Regla operativa Firebase (solo lectura)
Proyecto `friendly-123-ab7b3`, RTDB `https://friendly-123-ab7b3-default-rtdb.firebaseio.com`. Firebase CLI conectado EN Codex local, pero ninguna herramienta `realtimedatabase_get_data` está invocable desde ChatGPT web en esta sesión. Con Codex disponible: lectura autenticada /f123 de keys/HEAD en dos rondas (sin extraer licencias/keys en logs), compare /k + /o y pre/post head, hashes, recuentos causal Yjs, abonos decimales; cero `database:set/update/remove` y cero deploy. No presentar JSON empaquetado como prueba externa del HEAD.

**Este PRECODE precede cualquier edición de puntuaciones.**
