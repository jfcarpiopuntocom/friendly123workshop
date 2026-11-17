# Yjs causal-order replay, 5.000 sintéticos — RESULTADO MEDIDO

## Proveniencia exacta
- Fuente original sin cambiar: `projects/assembled-v783/evidence/coldjoin-yjs-order-benchmark.cjs` (un único script Node `vm`, sin acceso a red, sin clientes ni datos comerciales).
- Worker GitHub Actions: [run 44009395052](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44009395052), **SUCCESS** Node **v22.23.4** (Ubuntu 24.04), branch head de código de workflow `580a88aec0dc27b2a2355bb463cc3741d7499e60`; el job descargó bundle desde el checkout, no npm.
- Yjs bundle SHA-256 `a723f1618428ef38937626e8b72165a31ac41894fe7ab07f83d9bbb6cdd0176a`.
- 5.000 actualizaciones generadas por `Y.Doc({gc:false})`. Cada escenario aplica todas las actualizaciones al documento destino, verifica 5.000 entradas, ausencia de `pendingStructs` y **equivalencia binaria** de `Y.encodeStateAsUpdate` frente a estado de origen.
- La primera corrida [44009196029](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44009196029) falló antes del benchmark por `Cannot find module playwright` en precarga de guard de browser, no es resultado de Yjs. Plan anotó causa antes de corregir **solo** workflow. La corrección elimina precarga Playwright innecesaria; VM Yjs sigue sin API `require`/fetch/WebSocket.

## Mediciones de una ejecución, NO benchmarks reproducidos en iPhone

| Escenario | Duración Node22 | Progreso cada 1.000 updates | Entradas |
| --- | ---: | --- | ---: |
| Aplicación causal `applyUpdate` | **118 ms** | 31, 63, 82, 107, 118 ms | 5.000 |
| Aplicación inversa `applyUpdate` | **7.043 ms** | 433, 1.286, 2.646, 4.520, 7.043 ms | 5.000 |
| Inverso fusionado, lotes de 192 `mergeUpdates` | **113 ms** | N/A | 5.000 |

- Razones aproximadas de ESTA muestra: **59,7×** (inverso/secuencial), **62,3×** (inverso/fusionado). Se compara en un runner con bundle idéntico; no extrapolar esos ratios a otros documentos, navegadores, tamaños de updates o hardware.
- No se midieron WebKit/iPhone, cifrado/descifrado, Firebase/Supabase/red, y-indexeddb, bytes fotos, PIN/roles ni ack `business-committed`.
- Convergencia eventual Yjs en este script **no acredita recuperación de la historia real**: Yjs puede reconstruir el estado porque **todos los frames necesarios estaban disponibles**. Si un checkpoint omite padres, fusionar no crea el contenido ausente.

## Implicaciones y decisión provisional
La hipótesis de costo de CPU por updates fuera de orden merece prueba sobre el **camino real** de descifrar → aplicar Yjs → persistir IndexedDB → ACK verificado, pero estos datos no permiten cambiar `sync-yjs.js` ni el relay de producción. Fusionar fragmentos de un mismo corte podría acelerar cuando estén todos los ciphertext validados, sin perder capacidad de rescan causal; antes de cualquier optimización se requieren pruebas RED→GREEN sobre el módulo real, paginación, reordenamientos, desconexión, muchos emisores, duplicados, gaps no recuperables, payload malicioso y memory cap. Mantener cada operación comercial por `opId` y dinero/fotos separados de historia de catálogo.

## Próximo experimento registrado, NO ejecutado aquí
1. Fixture sintético de checkpoint+tail Yjs con 2-3 writers, gaps/reordenamiento, páginas de 64 y 192, suficientes dependencias; medir CPU y elapsed por fase en browser Chromium y WebKit con `y-indexeddb` y red local ficticia, nunca red real.
2. Comparar aplicación de frames individuales vs fusionión **sólo después de descifrado/autenticación**; ver que todo `pendingStructs.missing` se vacía con historia completa, y permanece bloqueado si faltan padres.
3. Asegurar que cursor durable no avance más allá del último frame aplicado y persistido; A→B→A×2 con operaciones únicas, idempotencia opId, dinero/stock/fotos/PIN, tras cierres/reinicio. No aumentar timeout para pasar; no mostrar Owner con historia incompleta.
4. Sólo con evidencia sobre código y navegadores reales, evaluar optimización aislada reversible y canario, jamás deploy ciego a cliente.

**NO-GO**: unión fría producción del 3–16 nov roja 14/14, un canario con excepción aún sin fase en producto, producto `friendly-123/master@94a4e047` sin cambios, negocio app-level y aceptación física pendientes. Enlace de continuidad [Notion](https://app.notion.com/p/41b1642b67f381998ad5eda4b3ac951c).
