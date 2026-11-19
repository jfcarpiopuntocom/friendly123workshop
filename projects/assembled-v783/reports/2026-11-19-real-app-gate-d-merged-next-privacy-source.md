# friendly-123 PORT 2.0 · Gate D integrado en APP REAL · 19 noviembre 2026

## Destino y resultado

El PORT es reemplazar arquitectura 1.0 por 2.0 en la **app real** `jfcarpiopuntocom/friendly-123`. Sync3 se conserva como parte de la nueva arquitectura. `friendly123workshop` contiene las pruebas/checkpoints y NO es el producto.

- **MERGED:** [friendly-123 PR #781](https://github.com/jfcarpiopuntocom/friendly-123/pull/781).
- **Master verificado:** `5beff22163b41f86aab312c29471d5946345a658` (antes `f53604b7e99ba8a9eb5f9e906199b17f110ebdcb`). Padre candidato `22ea37befbb6a96afffb61078b92e82d976e4023`.
- **Código:** `cloudflare-yparty-worker/src/index.js` +29/-0 líneas, más `open-existing-store.mjs` y `trusted-frozen-source.mjs`, 2 pruebas y fixture, workflow. Reutiliza los módulos originales existentes en app real, sin duplicación. `Tienda.onStart` llama al lector certificado antes de que el YServer cargue/entregue historia en QA.
- **TDD REAL:** [RED 16/20](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44463584973) (cuatro fallos causales antes del hook); [GREEN 25/25](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44463929641) en SHA de candidato exacto; 15 GitHub check-runs completaron SUCCESS, cero fallos. Workerd + Miniflare + SQLite/Yjs, historia dos escritores, -cat/-ops, SQL reabrir, padres faltantes, rollback y OFF. No se registra aprobación humana independiente en #781; el código es idéntico al auditado en workshop #133.
- **Estado Cloudflare inspeccionado por API (cuenta real):** `friendly123-yparty-port2-canary-qa`: `WS_AUTHORITY_QA=0`, `WS_SEPARATE_ROOMS_QA=0`, `WS_TYPED_COMMANDS_QA=0`, `WS_BUSINESS_EXECUTOR_QA=0`, `WS_PHOTO_BLOBS_QA=0`, `WS_OPEN_EXISTING_QA=0`; binding `WS_AUTHORITY` apunta a `friendly123-licencias`. FALTA `WS_FROZEN_HISTORY_SOURCE` y aún no se desplegó el nuevo hook en ese script. La app real `src/yparty-piloto.js` conserva un fallback obligatorio antes de conectar YParty, por protección ante exposición de datos privados (#765). Ni PIN, ni fotos, ni dinero, ni Sync3/shell han cambiado por #781.

## Auditorías y siguiente injerto causal

1. **Privacidad de la frontera Y.Doc:** no conectar `AuthorizedYProvider` a `API.doc` privado que transporta `_meta.pinsRol`, clientes, gastos, cobros y fotos. `cloudflare-yparty-worker/src/catalog-safe-projection.mjs` YA implementa proyección allowlist desconectada y tiene pruebas, pero todavía no es la ruta autenticada de aplicación. Elegir el injerto completo mínimo que entregue solo proyección segura o un sobre cifrado, con rechazo RED de bytes sensibles en el destino, firma de Owner/Team y una única autoridad comercial. No reactivar la foto HTTP sin cifrado.
2. **Fuente real para migración Gate D:** `readTrustedFrozenSource` exige Service Binding exclusivamente servidor-servidor, HEAD completo y SHA/vector Yjs. El contrato QA está acotado a 16MiB/4096 frames/5s. El canario Firebase anterior registró 6112 frames, 19 padres ausentes, 9 401 parciales; sin evidenciar independencia del emisor no hay import/GO real. Diseñar entrega paginada completa sin truncar o reformatear historia, conservar Sync3 y failback.
3. **Autoridad QA y prueba física:** emisor `/ws/ticket` desplegado está pendiente; no configurar permisos ni flags 2.0 desde datos de cliente. Tras fuente certificada, probar cold join real y A→B→A×2 PC Opera/Safari iPhone con recibos, existencias, dinero, fotos, PIN y una sola tienda.
4. **Auditorías de referencia:** [Qwen/Gemini 18-nov](2026-11-18-qwen-gemini-adversarial-audit-reconciliation-v801.md), [Gate D workshop #133](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/133), [Opus/Notion relevo](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94). No pisar otras reservas de `docs/sync-yjs.js` (#780), `docs/vista-perchas.js` (#779) o fotos (#778).

## Marcador congelado y etapa presente

**Calidad arquitectura 67/100; PORT operativo 61/100; GO comercial 0/6.** Rubros inmutables del `quality/port-v1.json`: A economía 20/20; B identidad 16/20; C fotos 7/10; D migración 10/25; E persistencia móvil 8/10; F físico 0/15. El merge es **evidencia de código injertado en producto**, NO una de las etapas faltantes del rubric; por eso el porcentaje todavía no puede saltar al 80 sin evidencia de los pasos restantes. No equivale a que el nuevo Worker esté desplegado ni a que clientes hayan usado 2.0.

**Rollback de código:** revertir el merge `5beff221` si se descubre regresión, conservando el estado/DB. Todos los switches Cloudflare siguen OFF; no cambio ni borrado de negocios.
