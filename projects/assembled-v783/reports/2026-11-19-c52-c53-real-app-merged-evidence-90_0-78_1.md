# friendly-123 · C52/C53 SELLADAS · MISMA aplicación real arquitectura 1.0→2.0

**Fecha local Ecuador:** 2026-11-19; GitHub/Cloudflare UTC 2026-11-20. Aplicación comercial existente: `jfcarpiopuntocom/friendly-123`. `friendly123workshop` es únicamente PRECODE/QA/registro persistente, **no otra app**. Sync3 se conserva. El trabajo no activa QA para clientes.

## C52 · injerto de fuente real v0.8.22

- [PR #851](https://github.com/jfcarpiopuntocom/friendly-123/pull/851) **MERGED** SHA `b223fe801ec9599949f135423551e63cf89105c4`, desde HEAD `660fa475939261f30465e73dab8f3caa2433a950`.
- **55/55 workflows completos GREEN** en candidato. **Cloudflare Workers Builds SUCCESS sobre exact SHA master** `b223fe801ec9599949f135423551e63cf89105c4`, build UUID `7244e3d1-20d4-422a-987d-078fe1b52c04`. Shell **v0.8.22 / f123-shell-v822 / golden358**.
- Cambio limitado en **`docs/sync-yjs.js`**: suspender `API.canalSombra.enviarUpdate(update)` y `API.opsCanal.enviarUpdate(update)` cuando `API.modoCorte20Activo=true`; suspender `API.fotosCanal.enviarUpdate(update)` cuando `API.corteFotosShaActivo=true`. Tras failback, los tres vuelven a emitir. Mantener `API.canal.enviarUpdate(update)` y Sync3; no es un retiro completo de escrituras 1.0. No cambia fuente contable reservada, clientes ni nuevos servicios.
- `test/p0-c52-legacy-channel-retirement.test.cjs` extrae handlers del **código propio de producto** a VM y comprueba 3 envíos suprimidos con flags ON y su recuperación con flags OFF. Regresiones C38, C47, C49, C51 y release incluidas. **No es** prueba física PC/iPhone ni canario comercial.

## C53 · audit score fixed100, GREEN y merge

- [PRECODE persistente antes del merge](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c53-c52-legacy-senders-reconcile-pr851-precode.md).
- [PR #852](https://github.com/jfcarpiopuntocom/friendly-123/pull/852) **MERGED** score-only SHA `7c5f6637ceab125711da84bbd25b1152a79b5df3`, HEAD exacto `7c46146655a3da87f29c8de05b2c9a8875ede40f`. No se modifica `docs/sync-yjs.js` por la puntuación.
- TDD **RED** primero en [Actions 44672540593](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44672540593), `89.5 !== 90.0` porque el scorecard antiguo aún era 89,5. Después JSONs originales + `scripts/architecture-2-port-score.cjs` y `test/p0-architecture-2-port-score.test.cjs` fuente/manifest/presupuesto fijo; [PR #852 checks](https://github.com/jfcarpiopuntocom/friendly-123/pull/852/checks) **11/11 success**, incluyendo C12/C30, release-control, p0-hotfix, stable, two-tab Chromium/WebKit.
- Cloudflare Workers Builds **SUCCESS sobre exact SHA merge master C53** `7c5f6637ceab125711da84bbd25b1152a79b5df3`, UUID `65cf2e1e-ab1a-44de-81db-584d111ec030`.
- Leí los dos scorecards **directamente en master tras merge**, sin usar workshop como fuente de producto: `docs/engineering/architecture-2-port-score.json` = **90.0/100.0** migración, desde 89.5 (+0.5); `docs/engineering/architecture-2-quality-score.json` = **78.1/100.0** calidad, desde 77.9 (+0.2); ambos `assessedProductSha` pinnean el verdadero **producto v0.8.22 SHA `b223fe801ec9599949f135423551e63cf89105c4`**, no el commit de puntuación. Grupo budget original **100.0**, 10.0 aún NO ganados, GO comercial **0/6**, físico **0/5**.
- Split estricto de la partida original `typed-delta-and-legacy-retirement` pendiente 1.5 → `c52-legacy-yjs-senders-retired-under-cutover` 0.5 **DONE** + retiro integral1.0 **PENDING**. Calidad dimensión migration 7.3→7.5/10; 0.2 por controles de envío fuente real y QA VM negativa/positiva, sin inferir estado de clientes. Otros pesos intactos.

## Presupuesto pendiente y puertas

| Capacidad | Acreditado | Peso | Pendiente |
| --- | ---: | ---: | ---: |
| Storage/Yjs + bloqueo local + arranque QA | 16.5 | 17.0 | 0.5 |
| Historia Firebase HEAD real y R2 | 13.5 | 18.0 | 4.5 |
| Economía tipada / recibos DO | 16.5 | 17.0 | 0.5 |
| Tickets Owner/Team y salas | 13.0 | 14.0 | 1.0 |
| Fotos SHA y CAS Workerd | 8.0 | 9.0 | 1.0 |
| Catálogo público | 10.0 | 10.0 | 0.0 |
| Navegador y retiro parcialmente certificado del 1.0 | 9.0 | 10.0 | 1.0 |
| Outbox/failback y aceptación física | 3.5 | 5.0 | 1.5 |
| **TOTAL** | **90.0** | **100.0** | **10.0** |

**No hay GO ni canario**: QA flags OFF, ninguna certificación física PC↔Safari/PWA A→B→A x2, historia y binding reales sin cierre, censo/PIN y legacy writer total pendientes. La PR [#841 ledger P0](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) sigue RED/test-only y `docs/core/ledger.js` reservado por auditor ajeno. No reproducir el reporte Hermes simulado como cambio real. El próximo avance debe cumplir causa raíz, fuente fusionada y prueba completa; no abrir nuevos frentes duplicados.

## Cierre

**Producto v0.8.22**, PRs #851 y #852 fusionadas y builds exactos verdes; puntuación oficial verificada en master **90,0 / 78,1**; Sync3 preservado; workshop persistente; total pendiente10,0 y GO0/6. Evidencias enlazadas para relevo entre agentes.
