# Score 2.0 · acreditar Gate C2 con fuente exacta sin mover pesos

Fecha: 2026-11-18 Ecuador, workshop main base `86d33c3e912bf9d3e9014f0114193d9c992f9e59`. PR foto fuente original [#117](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/117), integrada/merge [#128](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/128); pruebas nativas del SHA exacto `d31388d96afcadc23affbfce858ed37c2937c5cc` [#44454217429](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44454217429): 24/24 PASS (Chromium→WebKit y viceversa), 0 fallos. RED idéntica base anterior [#44453002009](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44453002009): 22/24, dos fallos por fallback a bytes Yjs. `photo-browser`/vendor SHA exactos success. QA ensamblado exacto sobre `cac2fe8` success; final SHA full integrado pendiente al corte. Desde #128, sin cambiar el cliente/producto ni activar 2.0.

## Rubrica JFC/Opus, sin reponderación
- Gate C peso 10 = `photo-sha-sql-blob` 3 (previo acreditado) + `yjs-sha-reference-only` 4 (este injerto en QA autenticada simulada) + `photo-restore-cross-device` 3 (requiere dos dispositivos físicos reales, permanece pendiente).
- Port total 57→**61/100** únicamente si test real y readback confirman `yjs-sha-reference-only` bajo bridge HTTP SHA activo. Calidad separada sigue 67/100 (±4); GO 0/6. El stage parcial no acredita login Owner real, foto cliente física, primera tienda ni release comercial.
- Específica salvedad: el `fotoSha()` actual se evalúa antes de `oc-login` en arranque frío y puede quedar nulo toda la sesión; componente SHA está probado con bridge habilitado por fixture. Próximo injerto debe hacer puente perezoso y disparar resiembra al `oc-login`, con permiso comprobado y sin Y.Doc privado Team. No ampliar criterio ni puntuar C3.

## TDD Ponytail y límites
1. RED: cambiar sólo `quality/port.test.cjs` para esperar 61 y Gate C=7; dejar `port-v1.json` en 57. CI `qa-v783-port-operational.yml` debe fallar exclusivamente por expectativa de score/reviewedSha, sin alterar tests comerciales.
2. GREEN: cambiar sólo un stage `yjs-sha-reference-only` a done=true, añadir evidencia exacta `sha=d31388...`, URL run, tipo y alcance. Revisar `reviewedSha` a fuente, `reviewedAt` 18-nov. Cambiar validador `port.cjs` que fija incorrectamente la fecha al día 17 para que acepte timestamps ISO de revisión posteriores a 2026-11-17. No tocar pesos ni etiquetas de gates.
3. Actualizar portada `quality/PORT-STATUS.md` con 61/100 candidato QA, columna C7 y 0/6; conservar 57 en secciones históricas. Encabezar `STATUS.md` con el mismo resultado y evidencia, sin reescribir historia previa.
4. QA exact-head `port.test.cjs` y `port.cjs`, source/metadata y GitHub CI. Ninguna ejecución costosa de modelos ni cambio de producción.
5. Append a Notion relevo with SHA y CI, GOOD/NO-GO. No cambiar planes de otras IAs.
