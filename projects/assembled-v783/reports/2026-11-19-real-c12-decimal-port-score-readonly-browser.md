# 2026-11-19 · C12 APP REAL · cifras /100 auditables y lector público C11 incorporado al bundle

## Semántica exacta y vigencia
**Producto que se porta:** `jfcarpiopuntocom/friendly-123`, mismo software 1.0→2.0, aprovechando injertos probados. **Sync3 ya es 2.0 y no se cuenta como pendiente.** Workshop guarda únicamente pruebas, plan y este informe; no es el producto. [Plan PRECODE](../plans/2026-11-19-real-c12-score-and-readonly-catalog-precode.md) anterior a cualquier edición.

**[PR app real #792](https://github.com/jfcarpiopuntocom/friendly-123/pull/792)** candidata, head revisado `8d8ce514568a01678fe38fde43c4f4e87ca9f71a` base `1b147ad99f4fdbf6cf60d8f6a57e7f79bbe3ad4a`. No afirmar MERGED hasta verificar exact SHA y CI.

## Métricas con décimas, calculadas de capacidades versionadas de la app
- `docs/engineering/architecture-2-port-score.json` y `scripts/architecture-2-port-score.cjs`: **78,5/100**. Baseline comparable **68,5/100** tras D7 antes de C8; variación **+10,0** por C8(3,0), C9(2,5), C10(1,5), C11(2,0) y C12(1,0). La rúbrica completa pesa **100,0**, distribuidos: SQLite/Yjs 17, historia/Firebase 18, dinero tipado 17, identidad/salas 14, fotos SHA 9, catálogo público 10, cliente 10, offline 5. Completos por categoría: **15,5 + 13,5 + 14,0 + 12,5 + 7,0 + 10,0 + 3,0 + 3,0 = 78,5**. Créditos binarios respaldados por código productivo y pruebas, hash exacto del bundle y enlaces SHA. **No** significa 78,5% del tráfico cliente ni GO autorizado.
- `docs/engineering/architecture-2-quality-score.json`: **71,5/100**, frente a 67,0 del control anterior (+4,5). Revisión de calidad editorial verificable por dimensiones, NO probabilidad de disponibilidad. Sync+1,2; seguridad+1,5; migración+1,8. Conserva físico 0.
- GO comercial **0/6** se informa *aparte*, nunca se resta del porcentaje de implementación.
- La vieja cifra **61/100** mezclaba prueba física/GO con la portabilidad arquitectónica: **retirada** de respuestas actuales, preservada solo para historia de auditoría.

## C12: límite seguro y compilación real
- `src/port2-readonly-catalog-session.mjs`: consulta certificado C11 `GET ...?frozen-proof=1` con cap Owner `cat:read` por bearer, obtiene NUEVA cap del emisor central para WS, crea Y.Doc **inicialmente vacío**, recibe solo datos públicos validados C9 y verifica paridad de vista local proyectada sin emitir structs del Sync3 privado.
- `src/ws-owner-ticket-params.mjs`: nuevo parámetro `catalogReadOnly:true` emite exclusivamente `['cat:read']`, nunca write ni ops/priv; default scopes anteriores intactos.
- `src/yparty-piloto.js`: punto de entrada público explícito `leerCatalogoPublicoCertificado`. **No** cambia la rutina existente `canal.conectar()`, la cual sigue con relay cifrado 1.0; no se constituye un segundo escritor. `docs/vendor/yparty-piloto.min.js` reconstruido por el compilador original y `docs/version-manifest.json` sellado con SHA `69d406925006fa98889ce0b499e2708857eccf3c856a631f62827d21da1cec6c`.
- Shell coherente v0.8.02, `f123-shell-v802`, `golden338` en `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`; seal QA fija nuevo hash comprobado y exige flags OFF.
- Permanece sin encender Cloudflare QA ni migración real; el código es ensamblado y callable, pero la ruta comercial sigue por defecto 1.0. Para subir el puntaje siguiente hay que cablear ese lector a los estados activos una vez certificada fuente real, sin duplicar Yjs.

## Pruebas TDD y auditorías
- [C12 inicial RED de entorno #44543844480](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44543844480) reveló import directo de `y-partyserver` no instalado en root durante el harness Node; se corrigió cargando el proveedor real únicamente cuando no hay inyección de prueba.
- [C12 GREEN #44543993334](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44543993334) fuente Yjs read-only 6/6 y puntuación 1/1.
- [C12 con bundle y puntuaciones #44545204680](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44545204680): comando devuelve **78,5/100 (+10,0) y calidad 71,5/100 (+4,5)**; 1/1 puntuación, 3/3 piloto, 10/10 tickets, 5/5 bundle, 6/6 política de catálogo, sin fallos.
- [Release seal RED #44545218310](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44545218310) detectó correctamente que no podía publicarse bundle cambiado con identidad v801. Se hizo bump a v802/golden338; el SHA del dashboard nuevo se comprobó mediante SHA256 independiente contra manifest del master y se incorporó en manifest v802; CI global final aún pendiente en el SHA de PR.
- Auditoría de reservas: `src/yparty-piloto.js` tiene reserva anterior; C12 sólo añade un método explícito y conserva ramas comerciales / Sync3 sin tocar. Fusionar únicamente con gates del SHA final.

## Próximo corte causal
Certificar origen Firebase real sin padres pendientes; conectar R2 y `WS_FROZEN_HISTORY_SOURCE` con pin independiente y `WS_CATALOG_ORIGIN_QA` exacto. Habilitar solo licencia QA cuando historial y rollback estén probados. Cablear C12 a la lectura real de catálogo y publicar deltas mediante un solo escritor Owner sin resembrar; después operaciones comerciales tipadas con ACK y failback. Pruebas físicas A→B→A ×2 y cash/photos antes de GO.
