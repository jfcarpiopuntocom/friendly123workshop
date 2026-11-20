# C59 PRECODE · score source-verified C58 permisos y lease, presupuesto fijo 100

20 nov 2026 Ecuador. Condicion: solo acreditar despues de [PR #858](https://github.com/jfcarpiopuntocom/friendly-123/pull/858) MERGED en la MISMA friendly-123, CI integral GREEN y Cloudflare SUCCESS exact SHA. Baseline oficial master f7d084e526f658f44d35b38c0785241b867180ea: **migracion 91,0/100,0 y calidad 78,5/100,0**, fisico0/5, GO0/6, Sync3 intacto. Workshop es registro, no producto. [Plan C58 funcional](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-20-c58-auth-role-epoch-coordinator-lease-precode.md).

## Evidencia previa
- RED autentico [GH Actions 44681992293](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44681992293), head f06ee21dc073003d6aa90b41532e869a0e76cabe: **18 PASS / 3 FAIL** sobre docs/sync-yjs.js original: Owner->admin sin release -cat lease, Owner->Owner nuevo login conserva writer viejo, fallo Team foto deja Owner PUT. C47 anterior pasa.
- GREEN exigido: docs/sync-yjs.js de la misma app tras verificar OCAuth. authEpoch++, revocacion sincrona de modo comercial, fotoSha y rol antes del rebind, coordinadorCorte20.failbackToLegacy para cualquier nuevo login autentico incluido admin y dueno. Empleado mantiene motivo previo. Sin autoarm 2.0. Version v0.8.24 shell824 golden360, manifest SHA exacto, 50+ CI y build del SHA fusionado; switches QA OFF.

## Presupuesto INVARIANTE: propuesta, nunca adelantar credito
- identity-rooms peso original14.0, ganado13.0 antes C58, commercial-role-switch pendiente1.0 -> split NUEVO c58-verified-login-revokes-old-catalog-lease 0.5 DONE source docs/sync-yjs.js evidence pinned a SHA merged; commercial-role-switch restante0.5 PENDING para aceptacion fisica y comercial. Migracion **91.0->91.5/100**, restante8.5.
- Calidad security 10.5->10.7 de15.0, delta+0.2; calidad TOTAL **78.5->78.7/100**, previous78.5. Otros grupos sin cambio, fisico0/5 y GO0/6. Esto es source/QA, no aprobacion de clientes ni historia economica real.
- Sin credito Firebase HEAD2.5, R2 binding2.0, dispatch, foto UI, legacy general, ni downpath fisico1.0.

## TDD puntuacion
1. Esperar C58 MERGED source exact SHA, CI total y Cloudflare SUCCESS.
2. Crear branch C59 desde ese master. RED primero solo test/p0-architecture-2-port-score.test.cjs: score91.5/78.7, delta migracion23.0 desde68.5, pendiente8.5, milestone0.5 DONE + rol comercial0.5 FALSE, security10.7 previous10.5, GO0/6 y fisico0.
3. GREEN SOLO JSON port/quality, scripts/architecture-2-port-score.cjs, docs/engineering/architecture-2-port-score.md. Guardar evidencia C58 source y tests, manifest hash y version >=824, SHA C58 del merge, presupuesto100.0 sin duplicar.
4. CI 11/11, merge, Cloudflare exact SHA, lectura de JSON master, Notion + workshop. Si falla, queda oficial91.0/78.5.
5. No tocar ledger PR #841 reservado, Firebase, R2, datos clientes, activar flags, o modificar Sync3 ajeno.
