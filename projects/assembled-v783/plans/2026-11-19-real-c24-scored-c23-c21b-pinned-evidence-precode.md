# C24 PRECODE · Puntuación real C23/C21b en producto, sin cambiar pesos /100
2026-11-19 Ecuador. APP REAL jfcarpiopuntocom/friendly-123, base SHA 10f6004cab97200c0f11359e21e9f7912d118945. Sync3 ya forma parte de 2.0. Workshop únicamente planes y evidencia. QA Cloudflare OFF, presupuesto adicional absoluto USD 0,00.

## Hallazgo y puntuación fija
Master real acaba de fusionar C23 #816 (v808: bundles e interfaces C16b-store, C18a fotos SHA Owner/Team, C19a escritor delta catalogo) y C21b #817 (v809: reconciliador, tombstone opId committed durable IDB v2; RED 6/7 pre-fix, GREEN incluido). `docs/engineering/architecture-2-port-score.json` sigue 81.5 y calidad 74.9, assessedProductSha anterior 3122010..., por lo que no refleja estos cambios.

Milestone browser-cutover de 4.0 puntos dice *typed-delta-and-legacy-retirement*, componentes distintos ya objetivamente verificables. **Preservar peso original 4.0** y dividirlo en (A) 1.5 `compiled-client-seams-c23` DONE: interfaces de inventario, fotos, delta exportadas en cliente real y selladas con manifest, QA OFF, evidencia #816/#817; (B) 2.5 `typed-delta-and-legacy-retirement` PENDING: flujo comercial/stock activo migra y relay viejo realmente deja de registrar. No marcar `browser-photo-cutover`, `storage/operational-switch`, `production-business-dispatch`, ni `offline-failback/verified-cross-device-downpath` como DONE sin prueba física o ruta realmente acoplada. Entonces **PORT 83.0/100.0**, baseline 68.5 -> +14.5. Si CI demuestra algo menos, no puntuar.

Calidad ingeniería: `durability` +0.5 de 17.3→17.8 por cierre comprobado de doble cargo post-commit-reload C21b #817; otros puntajes invariantes; calidad 74.9→75.4/100.0. Test exacto de 2 recargas sobre fake-indexeddb + Workerd y 32/32 checks #817; no iPhone real; gate GO separado 0/6.

## Verificación automática RED→GREEN
- Auditar `scripts/architecture-2-port-score.cjs`: anclar assessment SHA a 10f6004cab97200c0f11359e21e9f7912d118945, validación SHA para todas evidencias ya puntuadas; verificar `src/yparty-piloto.js`, `docs/sync-yjs.js`, `docs/vendor/yparty-piloto.min.js`, `docs/version-manifest.json`. Nuevo milestone no se acredita por texto JSON solo si las tres interfaces están en fuente, bundle y sync API, y SHA256 vendor+sync coincide manifest.
- Actualizar `test/p0-architecture-2-port-score.test.cjs` con exactos 83.0, 75.4, GO 0/6 y validación de presupuesto 100.
- No cambiar runtime ni shell v809 ni tests de negocio. Ejecutar CI de score y release. Cambiar SOLO JSON de puntuación, script de scoring y test de scoring; commit a app real, PR, GitHub 100% checks, master verify y Notion/handoff.

## Próximo injerto
Tras score, C25 integrar en piloto el coordinador C21a de transición con latches terminales y C19a bajo doble switch QA OFF; sólo elevar nuevo crédito si aporta una ruta real, no por tener otro módulo desconectado. No tocar código reservado por Antigravity sin revisar Buzón.
