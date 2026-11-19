# v800 · Belén / H2 · falsa confirmación en recuperación de fotos de percha

## Baseline y prioridad causal
- `friendly-123 master===estable` v0.7.99 SHA `1c9b476cb5ad371e7e84012a6b5a8bb5984377a4`; PR #775, 36/36 checks verdes. Cloudflare master build exitoso; adopción Safari física pendiente.
- Acta textual original idiomARTE 15/oct: solicitud de FOTO DE FACTURA EN EXPENSES y separación cash/transfer, más discrepancias de Casa/gastos/ventas. No confundir esas solicitudes con la corrección aquí: H2 es foto de PERCHAS, incidente posterior.
- Código real `docs/vista-perchas.js` `recuperarFotosPerchas` tenía `return estaCarga === cargaEnCurso && (!rr || rr.ok !== false)`. Ante `null` o `{status:500}` sin campo `ok`, devolvía éxito falso. No anclaba la identidad del negocio a la espera de historia/fetch. El callback de captura STK-H2 previo ya exigía `response.ok===true`, por eso H2 antiguo (7 pruebas) pasó sin detectar el defecto de la política de recuperación.
## RED genuine
- Rama independiente basada exactamente en master v799, [PR #776](https://github.com/jfcarpiopuntocom/friendly-123/pull/776), sin editar las PR externas #765/#769 ni el backend de ventas y dinero.
- El test nuevo `test/p0-belen-photo-recovery-pointer-strict-ack.test.cjs` ejecuta fragmento extraído **sin modificar** de la función fuente; simula respuesta nula, `{status:500}`, explícito `ok:false`, `ok:true`, cambio de cuaderno antes y durante PUT.
- [RED run 44436487172](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44436487172): **9 PASS / 4 FAIL** (null falso, respuesta sin ok, cambio de cuaderno durante PUT y antes del PUT). 7/7 pruebas H2 previas PASS. Nada falló por imports ausentes o mocks incompletos.
## Patch mínimo y GREEN
- Solo `docs/vista-perchas.js`: `cuadernoFotoRecuperacion` capturado antes de awaits; `mismoCuadernoFotoRecuperacion()` verificado antes y después de fetch; éxito estrictamente `!!rr && rr.ok === true`. No se modifica `OCFotos`, bytes, historial de respaldo, inventario, factura o catálogo comercial.
- [GREEN official seal run 44436792072](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44436792072): **13 PASS / 0 FAIL** real-source, `node scripts/build-app-entry.cjs --check`, `node scripts/build-dashboard-entry.cjs --check`, `node scripts/gen-manifest.js`, `bash check-sw.sh`, `node scripts/release-control.cjs validate 1c9b476...` success. Release v0.7.100 / shell f123-shell-v800 / golden336, manifest from exact SHA bytes.
- One-shot sealer removed. Exact ordinary candidate PR SHA `d5e5f6367d0afbcb867eeb2d954536ad4adf3add`. 21+ workflows in progress, Cloudflare required check not yet conclusive. No merge or publish claim until all required checks succeed.
## Next dependency
- H2 source only prevents false success; online automatic retry with durable intent and `fotoHash/fotoRev` CAS, lost-ACK recovery and same-shelf conflict are **not yet implemented**. Planned separately: `plans/2026-11-18-belen-next-root-photo-pointer-cas-readback.md`. Old bytes may be intact but pointer may still fail to reach peers. Do not auto-repeat an old blind PUT.
- Business priorities after photo integrity: direct Belén acta profitability discrepancies (Casa vs artista; expense summary, commission, event/bar) and 5 beers 29/9 customer misassociation require exact opId and transaction evidence rather than ad-hoc number edits.
