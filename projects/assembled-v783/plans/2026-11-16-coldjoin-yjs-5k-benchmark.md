# Investigación P0 coldjoin: 5.000 updates Yjs con orden invertido y lotes binarios

Fecha Ecuador 16 noviembre 2026 / UTC 17 noviembre. Base exacta `friendly123workshop/main@15445aa8b2214e7f87445ca79ac8bd57b0da729f`; PR #72 merged y su relevo en `STATUS.md`. Esta unidad es **QA/benchmark read-only**, NO migración, arreglo de Sync3, transporte ni release.

## Qué se intenta averiguar
El canario real de `friendly-123/master@94a4e047` observó 26 páginas y 4.966 frames cifrados al segundo 130, `more=true`, 15 padres Yjs faltantes, y luego una excepción no clasificada. El benchmark existente `projects/assembled-v783/evidence/coldjoin-yjs-order-benchmark.cjs` produce 5.000 updates con el Yjs vendor del taller; mide `applyUpdate` en orden causal, inverso y lotes de 192 unidos con `Y.mergeUpdates`. Sus valores desconocidos deben medirse, no inventarse. Esto NO simula cifrado/red/WebKit/IDB ni demuestra causa del canario real.

## Método seguro, plan primero

1. Rama aislada de GitHub desde SHA exacto; no editar el benchmark preexistente ni tocar runtime de aplicación, IndexedDB, relay, PIN, PWA, Sync3 o cliente.
2. Crear solamente workflow `.github/workflows/qa-v783-coldjoin-yjs-order-benchmark.yml` Node22 con ruta exacta y red de producción bloqueada; no secrets, no llamadas externas, sin deployments.
3. Ejecutar el script original, conservar stdout JSON+SHA+log TAP y exit (también si falla). Timeout total <= 8 minutos; no descartar un fallo ni elevar timeout por comodidad.
4. Verificar que las tres ejecuciones generan 5.000 entradas y `pendingStructs=false` por las assertions del script; registrar `ms` exactos, CPU/runner y hash del bundle para comparar dentro de la misma ejecución (sin universalizar latencia).
5. Si GREEN, no interpretar como fix de coldjoin. Contrastar el coste de decodificar/aplicar Yjs contra observación de red `pull-page` y CPU reales antes de elegir batch/compaction. Si RED, clasificar por falla: missing parent, byte-level equivalence o límite CPU y documentar.
6. Actualizar Notion y `STATUS.md`, hacer PR al workshop y fusionar **solo si** ejecución segura, revisión de archivos y resultado documentado. Si otro agente toca el mismo fichero, NO overwrite; branch separado.

## Fuentes externas verifiables
- https://docs.yjs.dev/api/document-updates — `Y.applyUpdate` conmutativa/asociativa/idempotente sólo con historia completa; `Y.mergeUpdates` fusiona bytes, `encodeStateVector` y `diffUpdate` permiten diferencias que siguen necesitando historial. No supone que Firebase o un relay cifrado pueda deducir el negocio ni regenerar faltantes.
- https://github.com/yjs/yjs/blob/main/INTERNALS.md — reloj/cliente, estado causal, dependencias.
- Fuente local: `evidence/coldjoin-yjs-order-benchmark.cjs` SHA verificado antes del trabajo.

## Continuidad tras límite de 5h
Rama `qa/20261116-coldjoin-yjs-5k-benchmark`, plan presente antes de workflow; consultar PR, runs y archivos. Trabajo de port en producción pertenece a otro carril: no tocar `friendly-123`. Gates abiertos: historia/ACK aplicación, problema multipestaña, reconciliación snapshots, Owner real y 2 ciclos físicos PC↔iPhone. Sin GO comercial.

## First CI run: infrastructure failure, benchmark not executed

[Actions 44009196029](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44009196029) on `df3350db6f20ab08377dcd71530abfc355e1f215` failed in first benchmark step: **`Cannot find module 'playwright'`** imported by `app/test/helpers/sin-red-produccion.cjs`. This helper is designed to patch Playwright browser launches, unnecessary for this benchmark and requires npm-installed browser package. No Yjs measurement happened, no timing or causal result can be claimed. The script itself remains unchanged. The Yjs bundle runs in a `vm` context exposing only console, WebCrypto, typed arrays, maps, promises and timers, **without** `fetch`, `require`, `WebSocket` or network APIs. Node wrapper only reads local files; the benchmark has no socket/fetch calls. For this pure synthetic Node job, remove browser-specific preload rather than installing Playwright or modifying source; no other files changed. Preserve failed run; repeat with true script and same 360s limit.
