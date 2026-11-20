# C64 PRECODE — congelado sin base no equivale a reapertura fiable
> **For agentic workers:** usar Ponytail, Superpowers, TDD RED→GREEN y verificar HEAD exacto. Plan archivado ANTES de editar código.

**Fecha:** 20-nov-2026 Ecuador. **Mismo producto** `jfcarpiopuntocom/friendly-123`; arquitectura1.0→2.0, Sync3 preservado, QA OFF. **Master previo acreditado** `1925ae864bb1eedd675318ffa02b7ef7815e2557`; transición **92,0/100**, calidad **79,1/100**, GO comercial0/6 y físico0/5. Workshop es solo taller/registro. No trasladar app.

## Riesgo de raíz y contrato

`cloudflare-yparty-worker/src/open-existing-store.mjs` rama `prior f123_frozen_imports`: `exportCompleteYpartyYjs({storage,channel})` comprueba que el conjunto de frames reconstruya Yjs sin padres pendientes. Pero acepta `snapshotKind:'none'` cuando todas las filas de `documento_bloques` desaparecieron y sólo quedan entradas en `diario`. Un recibo previo de importación congelada fue instalado con instantánea base obligatoria por `installFrozenImport`; si la base desaparece antes de reapertura, el journal, aunque sea sintácticamente válido, **no prueba que se conservó toda la historia congelada**. En -cat no existe baseline económico opId como en -ops. Condición de rechazo y no ACK, sin borrar/restaurar/sintetizar datos.

## Una corrección mínima (solo si RED auténtico)

1. Nuevo test de regresión source-executed sobre `openExistingStore` real: recibo válido de tabla de importación, SQL con journal Yjs válido y sin filas en `documento` ni `documento_bloques`; debe devolver `opened:false`, nunca `opened:true`. Control positivo: base Yjs presente + journal posterior válido permite apertura sin pedir certificado remoto, conserva el hecho nuevo. QA sin clientes, roles, remote Firebase ni nuevas rutas. Usar un stub de SQL leído exactamente por `exportCompleteYpartyYjs`, o suite Workerd si se puede inyectar storage sin cambiar código comercial.
2. Capturar **RED CI** contra código original; identificar expected vs actual. No atribuir defectos al motor Yjs si el harness falla.
3. **GREEN**: tras export completo del SQL, cuando hay `prior` exigir `now.snapshotKind!=='none'`, fail-closed con mensaje genérico sin secretos; conservar journal/new ops, no comparar todo el SHA inicial con estado legítimamente modificado, no cambiar semántica de `ops` ni fallback.
4. Ejecutar test focal + suite Workerd cold join real + validadores de port y CI integral sobre SHA final. Si hay fallo no relacionado, no fusionar. Etiquetar claramente SQL stub vs Workerd real.
5. Registrar resultados en Notion y workshop, exact master SHA/build; no dar GO comercial. **Sin nuevos puntos de migración** por esto, ya que todos los 8,0 restantes de la rúbrica frozen son pruebas reales/bindings/aceptación. Solo considerar calidad si la fuente completa y la evidencia pasan los gates, sin alterar pesos.

## Reserva de archivos

Nuevo test `cloudflare-yparty-worker/qa/p0-c64-frozen-base-readback.test.mjs`; única fuente candidata `cloudflare-yparty-worker/src/open-existing-store.mjs`; posible workflow nuevo `.github/workflows/qa-c64-frozen-base-readback.yml`. **No modificar** `docs/core/ledger.js` reservado [#841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841), `docs/sync-yjs.js`, `src/yparty-piloto.js`, Worker routes, PIN, dinero, Cloudflare settings, R2 ni clientes.

## Rollback y aceptación

Branch aislada y PR (draft hasta CI). Failback previo intacto; si fuente incompatible o certificados antiguos válidos se rechazan injustificadamente, revertir sólo el guard C64. No publicar/activar 2.0 con una sola suite verde. R2 no creado; HEAD auténtico Firebase2,0 y binding R2 2,0 continúan pendientes.
