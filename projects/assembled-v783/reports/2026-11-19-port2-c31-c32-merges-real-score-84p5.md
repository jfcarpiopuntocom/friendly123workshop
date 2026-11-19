# C31 + C32 · cierres verificados de arquitectura 1.0→2.0 (19-nov-2026, Ecuador)

## Principio JFC
El "port" es el proceso de sustituir componentes frágiles 1.0 por injertos probados en la **misma app** `jfcarpiopuntocom/friendly-123`, conservando Sync3 como primer injerto 2.0. `friendly123workshop` es laboratorio/QA/documentación, NO es la app ni puntúa. Las métricas decimales fijas son migración arquitectónica /100 y calidad arquitectónica /100; gates comerciales físicos se certifican separadamente.

## Resultado integrado en master — SHA exactos
1. [PR #826 C31](https://github.com/jfcarpiopuntocom/friendly-123/pull/826) MERGED: master `07fada25fd9c6b3ee92d13752fb8497881bce12c`, rama HEAD `0748c78461c31d191fa6ef4175a97d19f3846e2d`; 51/51 checks reportados SUCCESS. Código real `docs/sync-yjs.js` enruta condicionado al modo QA las ventas, ajustes y abonos al coordinador comercial C25; controla duplicación de opId previo a init Safari (C27+C29), corte de sombra fotos SHA si PUT+ref exitosos y permisos de foto Owner/Team. Shell v0.8.13. QA OFF por defecto, ninguna escritura Cloudflare/R2.
2. [PR #827 C32](https://github.com/jfcarpiopuntocom/friendly-123/pull/827) MERGED en master `f569de099d6044688fe82750ba5cc54f43b8b788`, HEAD `f6988a933c540265a71234cae6940d53b7d83c7a`, **11/11 workflows SUCCESS, 0 FAIL, 0 PENDING**. PRECODE persistido en workshop antes de editar: [plan C32](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-real-c32-c31-audited-partial-score-precode.md), workshop commit `dc9ae1fc32105c1126f590f9e8132bc359239ed5`.
3. **RED real antes de implementar:** [GitHub CI scored-real-product run 44626702677](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44626702677) registra `84 !== 84.5` (test nuevo esperaba 84,5 mientras código rubricaba 84,0).
4. **GREEN posterior:** [CI C30 score en C32 run 44626953423](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44626953423) SUCCESS; 11/11 workflows de HEAD C32 terminaron SUCCESS. Diff C32 solo 4 archivos: dos JSON de score, script de auditoría, test; sin nuevos cambios al runtime/Worker/pago/deploy.

## Marcadores oficialmente incorporados en el producto
- **Migración 1.0→2.0: 84,5/100,0** (84,0→84,5, +0,5 verificado C31 por enrutamiento comercial real detrás QA). Crédito meramente parcial: el saldo original de retiro de legado 2,0 fue dividido en C31 0,5 DONE y *typed-delta-and-legacy-retirement* **1,5 PENDIENTE**. Rúbrica sigue sumando 100,0.
- **Calidad arquitectura: 75,8/100,0** (sin cambio: no hay evidencia física nueva que acredite calidad adicional).
- **GO comercial: 0/6** (no implica migración de tiendas reales ni tráfico de cliente pasado al nuevo backend).
- `docs/engineering/architecture-2-port-score.json` y `architecture-2-quality-score.json` en master C32 se anclan ambos a `assessedProductSha=07fada25fd9c6b3ee92d13752fb8497881bce12c` (producto real previamente fusionado C31). El HEAD de puntuación propio es C32 merge `f569de099d6044688fe82750ba5cc54f43b8b788`.

## 15,5 puntos aún no ganados (presupuestos inmutables)
- Activación storage 1,5; historia Firebase certificada 2,5; binding R2 2,0; despacho comercial en producto para clientes 3,0; cambio de roles comercial real 1,5; corte fotos SHA browser físico 2,0; retiro de resto tráfico 1.0 1,5; downpath entre aparatos verificado 1,5.
- Priorizar causalidad de incidentes de Belén: una venta comercial única, stock/dinero coherentes, recibo durable y fotos sin duplicidad; después validación A→B→A ×2 PC/iPhone, reinicio Safari, TOCTOU multipestaña, roles Team, importaciones reales con respaldo. Un gate físico NO se considera verde por CI sintética.
- No activar flags QA ni migrar tiendas de Belén o gasto Cloudflare/R2 sin corte seguro, autoridad y respaldo. Nuevo gasto aquí: USD 0,00.

## Método
PRECODE compartido → reserva Notion para evitar colisiones → RED real → injerto Ponytail mínimo completo en producto → GREEN CI SHA fijo → merge comprobado → reporte Notion/workshop → volver a medir. No diseñar otro sistema ni parchear redundancias 1.0 salvo bloqueo de seguridad que no pueda esperar.