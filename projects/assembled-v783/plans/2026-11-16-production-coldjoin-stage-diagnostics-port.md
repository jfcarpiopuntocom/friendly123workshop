# P0: Portar exclusivamente diagnóstico seguro de fases al canario REAL de unión fría

**Fecha Ecuador:** 2026-11-16 (UTC 2026-11-17). **Workshop base:** `291c907fcaf74a5730b69d6ae8cbc408dec77886`. **Producción base (NO CAMBIAR DATOS):** `friendly-123/master@94a4e047cdb0b2b14cbab004de599d7e43fef79b`.

**Objetivo:** el canario programado [run 43961509893](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/43961509893) terminó con la excepción genérica `FALLA EXCEPCION: Error durante la unión` después de páginas Yjs cifradas. Necesitamos distinguir si el error se produjo en navegación, ingreso de unión, diagnóstico, checkpoint, recuperación o control de acceso, sin revelar ni adivinar secretos; este cambio NO modifica el funcionamiento de la app, solo el script de QA. El canario no toca clientes y su PIN sintético tiene budget de un único intento Owner.

## Relevos y límites

- Workshop PR #72 añadió fases estables al **canario ensamblado** (distinto del canario en producción, que no posee `PILOTO`). Los tests 29/29 y QA 585/585 de PR #72 fueron verdes, pero no prueban que el canario de producción tenga la instrumentación. Este trabajo hace port **selectivo**, no copiar el archivo entero.
- Workshop PR #74 corrigió `guardarPullCursor` en la app ensamblada; no se porta aquí, sin permisos de usuario ni publicación. Codex tiene reserva de `docs/sync-outbox.js`, por lo que queda expresamente fuera del diff.
- Confirmado Notion: prioridad browsers Chrome/Opera/Safari antes que PWA. **No tocar** docs/, SW, manifest, PIN, inventario, proveedor, relay, producción de negocio, datos reales, release ni clientes.
- Alcance de escritura únicamente `friendly-123/scripts/canario-union-fria.cjs`, nuevo `friendly-123/test/p0-coldjoin-safe-stage.test.cjs` y actualización **mínima** de `friendly-123/.github/workflows/p0-cold-join-canary.yml`. Plan y resultados permanentes en workshop y Notion.
- Notion reserva vinculada a este fichero; rama propuesta `qa/20261116-coldjoin-stage-safe` sobre SHA `94a4e047cdb0b2b14cbab004de599d7e43fef79b`. Nunca editar master sin PR/revisión.

## RED antes de código

1. Crear test de VM que lee el **script real** `scripts/canario-union-fria.cjs`, sustituye Playwright con browser sintético sin red ni PIN reales. Inyectar `Error('SECRET_CANARIO_FICTICIO_NO_IMPRIMIR')` en la navegación, unión y recuperación. Debe salir `CANARIO_ERROR_ETAPA: NAVEGACION | UNION | RECUPERACION`, mantener exit!=0 y `FALLA EXCEPCION: Error durante la unión`, sin emitir el error ni licencia en logs. Exigir ningún intento Owner extra.
2. Prueba hostil: reemplazar `error.name` con texto que contenga un secreto ficticio y verificar que se sustituye por clase validada `Error`. Probar `pageerror` e IIFE externo con nombre hostil para impedir filtración fuera del `catch` interno.
3. Workflow existente añade test focal, sin credentials ni network. Ejecutar SHA sin modificar canario: RED debe fallar **solo** por condiciones esperadas. Guardar logs, HEAD, conteos, limitaciones en workshop/Notion antes del patch.
4. Si la prueba del mock es inválida por su fixture, corregir solo el mock documentando RED espurio; no alterar expectativas para falsificar éxito.

## GREEN mínima

- Emisión `CANARIO_ERROR_ETAPA` con allowlist de constantes en punto sensible; jamás interpolar URL, PIN, `e.message`, stack, room, licencia o ID de Yjs.
- Sanitizar `error.name` en `catch` interno, `pageerror` y `.catch` externo con allowlist de clases específicas, sin truncar secretos crudos. Conservar texto genérico de fallo y exit!=0; no reintentos Owner, ni alterar timing de recuperación, ni ampliar timeout.
- Revisar `test/canario-union-fria-guard.test.cjs` completo y test nuevo en 3 pasadas de CI, más otras suites que se activen. Al no cambiar docs/, el contenido Pages comercial no se modifica. No ejecutar el canario de producción en la PR con token sintético real.

## Gate de aceptación

- Resultado RED verificado bajo SHA anterior; GREEN focal y test histórico, **3×** en CI sobre HEAD exacto, 0 SKIP/CANCEL, diff limitado a tres archivos QA, ninguna credencial en logs, conservación de salida del canario. Guardar TAP/HEAD cuando el workflow lo permita.
- Solo si se cumplen, merge en `friendly-123/master` exclusivamente del canario QA. No equivale a resolver coldjoin ni a publicar app; el próximo canario real puede revelar la fase fallida sin necesidad de nueva licencia ni PIN.
- Próxima acción real: usar `CANARIO_ERROR_ETAPA` en un canario autorizado sobre tienda sintética ya configurada; separar excepciones de browser del tiempo de aplicar Yjs y causa de `pendingStructs.missing` sin incrementar timeout.

## Riesgo / NO-GO vigente

Canarios reales anteriores 14/14 rojos, falta resolver unión fría y replay durable de negocio, staged timestamp ties, fotos, dinero, roles/PIN y 2× A→B→A físico PC↔iPhone. La QA verde 585 no certifica comercial ni acceso remoto. PWA aplazada por decisión actual del usuario. Este plan prohíbe copia integra del canario workshop porque difiere su entorno PILOTO.

## Primer RED observable antes del runtime — PR producción #740

- [Actions 44012419072](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44012419072) sobre SHA de PR de tests/workflow `4c9de22615a281d152502bc35525518762251120`, **31 tests, 26 PASS / 5 FAIL / 0 SKIP/CANCEL**. Cinco fallos están en las tres etapas sin clasificar, catch interno con `e.name` hostil y catch externo con `e.name` hostil.
- **Falso GREEN detectado en test nuevo de `pageerror`**: el script original hace `(e.name||'Error').slice(0,32)`, y el test solamente buscaba el marcador secreto COMPLETO, cuyo largo excede 32; un fragmento sí podría filtrarse. Antes de tocar código de producción, corregir exclusivamente el test para negar también prefijo (mínimo 12 caracteres, y exactamente 32). Mantener todos los asserts de status/PIN. Repetir RED con SHA exacto sin cambios en el script y registrar 6/6 fallos causales.
- No concluir seguridad de `pageerror` con el primer RED: su salida estaba subtesteada. No borrar la corrida RED anterior.
