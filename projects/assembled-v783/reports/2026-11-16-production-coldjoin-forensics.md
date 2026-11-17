# Unión fría de producción: contraste forense, 16 nov Ecuador

Lectura solamente; sin lanzar canarios ni usar datos reales. Fuente canario `jfcarpiopuntocom/friendly-123` master SHA `94a4e047cdb0b2b14cbab004de599d7e43fef79b`. Workflow y fixture sintética existentes; no se cambiaron runtime, ramas ni clientes.

## Evidencia primaria del 16 nov
[recorrido 43961509893](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/43961509893), iniciado 21:34:50 UTC (16:34:50 Ecuador), evento schedule, SHA exacto arriba. Job `recorrer` 133629839897 SUCCESS; job `union-fria` 133629840518 FAILURE. El guard del canario pasó, y falló el paso del aparato sintético. Se observa `licencia y sala correctas`, checkpoint inicial disponible, y progreso de páginas de Firebase. Pulso 34 s: 11 páginas / 2101 frames, 7 padres faltantes; pulso 130 s: 26 páginas / 4966 frames, `pullUltimaMas=true`, 15 padres faltantes, recuperación true, metadatos Owner false. Esto indica pull aún incompleto en el último pulso; no prueba que la ejecución completaría posteriormente, que una venta real se haya perdido ni qué componente causó la demora.

El desenlace preciso **no fue un timeout explícito** en el log: a 21:38:47 UTC, `CANARIO_DIAGNOSTICO: lecturaDiagnosticoFallida=true` y `FALLA EXCEPCION: Error durante la unión`. El canario oculta intencionalmente mensajes de excepción para no filtrar URLs o credenciales; no se conoce causa a partir de esta salida. Al final se reportó checkpoint existe y categoría de diferencia `1d-o-mas`; es una categoría de metadatos, no prueba única de causa. Observer registró Firebase respuestas 4xx y un fallo de red sin URLs ni contenido; tampoco atribuirles causalidad. No se llegó a registrar Owner autenticado ni el stock final.

## Serie programada comprobada
Se consultó cada job `union-fria` y `recorrer` de las **14 corridas programadas diarias entre 3 y 16 nov**. En todas `union-fria` fue FAILURE y `recorrer` SUCCESS. El [2 nov 41527443693](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/41527443693) ambos fueron SUCCESS; el [3 nov 41698831370](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/41698831370) `union-fria` FAILURE y `recorrer` SUCCESS, SHA `861d2b2da90b03a03a7d7d08d4c5c152edb52551`. Una correlación con ese commit no demuestra causalidad. El dato OpenCode 32/40 para todas las corridas, incluyendo eventos distintos a schedule, **no se verificó en este muestreo**.

## Siguiente investigación segura
1. Reproducir offline con historial cifrado sintético y checkpoint/tail controlados, instrumentar fases de lectura de páginas y aplicación Yjs, medir tiempo, tamaños y eventos; no aumentar límite para declarar verde.
2. Revisar fuente de la excepción observada sin imprimir URL, capacidades de sala, contenido ni credenciales; distinguir evaluación Playwright, cierre de página, espera y diagnóstico.
3. Comparar checkpoint e historial con fuentes/efectos de v653/v733/v751, reproduciendo hipótesis una a una; mantener aislamiento y límites de gastos. No escribir en el relay productivo ni probar con aparatos/identidad reales.
4. Independientemente, un canario de lectura de interfaz en verde no demuestra venta, unión en frío o convergencia de clientes. Faltan ACK verificable y pruebas PC/iPhone según aceptación.

## Alcance: outbox manual vs unión fría Yjs
En SHA `94a4e047`, `scripts/canario-union-fria.cjs:225–235,370–374` verifica canal `window.OCYjs`, hidratación y-indexeddb, dependencias causales y metadatos PIN. No contiene referencias directas a `OCOutbox`, `f123_outbox` ni `f123_sync_pending`. `docs/sync-yjs.js:965–980` usa la prueba de hidratación y-indexeddb; `:1942–2052` maneja `pull-page`, continuación de páginas y cierre de recuperación bajo las guardas causales y HEAD. Tampoco contiene referencias directas a esas claves del outbox manual.

`docs/avanzado-extra.js:73–79,95–103,116–131,205–211` usa otra cola, opcional `f123_sync_on`, y `OCOutbox` para snapshots de operaciones manuales; el comentario `:260–267` identifica el relay WebSocket como camino principal. Estas son relaciones estáticas, no prueba dinámica de ausencia de todas las interacciones indirectas. El port de retry de `sync-outbox.js` no demuestra reparación del canario ni causalidad en ese resultado.
