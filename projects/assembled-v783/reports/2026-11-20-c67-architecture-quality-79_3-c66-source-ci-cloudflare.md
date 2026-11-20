# C67 · Reconciliación arquitectura 2.0: port 92,0 / calidad 79,3

**Fecha:** 20-nov-2026 Ecuador. El PORT es el proceso de PORTAR la **MISMA** aplicación `jfcarpiopuntocom/friendly-123` desde arquitectura1.0 hacia arquitectura2.0 por injertos de componentes maduros. **Sync3 ya es 2.0 y se conserva**. `friendly123workshop` solo laboratorio, planes, QA y reportes. El código funcional C66 se integró al repositorio real. Flags QA OFF; clientes, PIN, ventas reales, R2 y Cloudflare settings intactos. Ledger `docs/core/ledger.js` sigue reservado por otra IA en [PR #841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841).

## Doble métrica oficial /100 original con decimales

| Métrica | Antes C65 | Ahora C67 | Cambio |
| --- | ---: | ---: | ---: |
| **Culminación transición MISMA friendly-123 1.0→2.0** | 92,0/100,0 | **92,0/100,0** | 0,0 |
| **Calidad arquitectónica** | 79,2/100,0 | **79,3/100,0** | +0,1 |
| Calidad — durabilidad | 18,5/20,0 | **18,6/20,0** | +0,1 |
| GO comercial | 0/6 | **0/6** | 0 |
| Físico PC Opera↔iPhone Safari/PWA | 0/5 | **0/5** | 0 |

**Port todavía tiene 8,0/100,0 no ganados:** historia Firebase HEAD económico REAL 2,0, R2 Service Binding REAL 2,0, operacional/roles/fotos/failback físico 4,0. No modificar el presupuesto de 100 ni confundir QA nativa, Workerd o WebKit de CI con un iPhone real o certificado comercial.

## Fuente real C66 y reproducción

1. [PRECODE C66 en workshop](../plans/2026-11-20-c66-frozen-vector-causal-continuity-precode.md) guardado ANTES de editar fuente y [registro Notion](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94). Causa: C64 verificaba que una importación congelada conservase el formato de bloque, pero al compactar el SQL podía contener SOLO Yjs de un escritor reciente sin conservar la historia de otro escritor anterior. `pendingStructs` vacío y `snapshotKind='blocks'` NO bastan para certificar continuidad histórica.
2. [RED fuente real run 44735648192](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44735648192): **1/2 PASS**, caso negativo `true !== false`; `openExistingStore` devolvió `opened:true` pese a haber desaparecido del SQL el escritor original. **Node22 SQLite nativo real, Yjs real, importador real**, solo datos sintéticos, sin Firebase ni dispositivos externos.
3. **GREEN C66** injerto sobre API madura Yjs `Y.decodeStateVector`, `Y.encodeStateVector`, `Y.encodeStateVectorFromUpdate`: vector original SHA-certificado almacenado en nueva tabla mínima `f123_frozen_import_vectors` en la **MISMA transacción SQLite del baseline Yjs, certificado y ops de negocio**. Cada cold reopen vuelve a verificar SHA del vector y dominancia de relojes por cada writer original sobre snapshot+journal antes de `opened:true`. No se rellena una base histórica ausente desde el presente: el recibo antiguo incompleto falla cerrado. El test deja pasar Yjs tombstones legítimos, no exige igualdad de SHA estado nuevo vs viejo.
4. [GREEN run 44736130197](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44736130197), fuente final `cee89827c5f62a08fddd069f8769410447db5736`: **6/6** C66 SQLite real; **9/9** importador SQLite; **3/3** C64; **5/5** Tienda onStart Workerd/Miniflare real; score CLI fijo100 PASS. **15/15 GH Actions workflow SUCCESS** en exact head, release/stock/econ/Safari WebKit QA. La dominancia vectorial es condición necesaria causal, **no hash íntegro de importe/productos/eventos**; `-ops` mantiene baseline económico exacto C14 separado.
5. [PR #866 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/866), código funcional `friendly-123/master@a46da3753ec23ecee2606f5ed206fe4c6ba10f25`, **Cloudflare Workers Builds GET** rama master, SHA exacto a46da..., **`build_outcome=success`** build `b091735c-0cc5-4351-9c29-f5894c836544`, sin escribir ajustes ni crear recursos.

## C67 score-only RED→GREEN, auditoría original100

- [C67 PRECODE](../plans/2026-11-20-c67-c66-vector-continuity-quality-79p3-precode.md) persistente antes de modificar score, [PR #867](https://github.com/jfcarpiopuntocom/friendly-123/pull/867) score-only. Score RED [run 44736978877](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44736978877): test fuente exigía calidad79,3, JSON aún 79,2, **falla auténtica `79.2 !== 79.3`** (no fallo negocio). Tras RED se cambió únicamente `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs` y Markdown score.
- Score GREEN [run 44737307434](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44737307434), exact head `429bca25d2d2b23509d9aa3c2875d17bbc1b55d1`: CLI devuelve `port:92,quality:79.3,qualityBefore:79.2,qualityDelta:0.1,go:'0/6'`. Validador exige source C66 real y tests negativos, y conserva todos los hitos originales: 8,0 pending. **11/11 GH workflows del head final SUCCESS**, incl C12/C13/C30, release-control, p0-hotfix y 2 pestañas Chromium/WebKit.
- **PR #867 MERGED** en `friendly-123/master@b6c24a0ed1573dff8321728e78b79672d20b440f`. Ambos JSON puntuadores releídos de ese SHA: port=92.0, quality=79.3, durabilidad18.6, physical0, comercial GO0/6; original100 intacto. **Cloudflare Workers Builds API GET real**: script friendly-123, master, SHA exacto `b6c24a0ed1573dff8321728e78b79672d20b440f`, **SUCCESS**, UUID `146a92a2-a44a-45c1-b818-c32330b7264b`. Build CI != activación 2.0 en clientes.

## Siguiente camino causal, prioridad Belén

Certificar la historia económica **verdadera** de Firebase con estado HEAD, opIds, dinero, stock, deudas, fotos y padres Yjs antes de escribir un manifiesto inmutable. Después conectar su fuente por Service Binding en QA y R2 existente/creado solo con aprobación de recursos, hacer lectura y failback real, luego dos ciclos físicos PC Opera→iPhone Safari/PWA→PC. Priorizar fiados, stock y fotos reportados por Belén por su causa común, no por orden de quejas. Prohibido borrar registros de clientes por una prueba o tratar falsos ACK como ventas confirmadas.

**STATUS.md workshop:** debe señalar la dupla CANÓNICA actual del producto en la primera línea; el histórico 61/67 QA del 18 nov sigue siendo archivo histórico, no estado de producción.
