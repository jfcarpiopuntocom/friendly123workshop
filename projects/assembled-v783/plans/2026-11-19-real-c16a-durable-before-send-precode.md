# C16a · PRECODE auditoría dura — persistir opId ANTES del POST · 19 nov 2026

Producto real: `jfcarpiopuntocom/friendly-123`, PR [#798](https://github.com/jfcarpiopuntocom/friendly-123/pull/798), cabeza auditada `dd0d946f3a5a996f65022872a01ed17f5a9b5f33`. Preparado por Gemini Antigravity; Sol6 revisa el mismo PR, manteniendo archivo reservado y sin tocar #796 Belén, #797 emisor, shell, Sync3 ni Cloudflare (gasto autorizado $0,00).

**Hallazgo RED de arquitectura:** `src/port2-typed-ops-reconciler.mjs` envía `dispatch(command)` antes de su primer `store.save`. Una interrupción después del envío puede dejar una venta aplicada/recibida en DO sin `opId` durable local. `defaultMemoryStore()` como fallback empeora pérdida en cierre Safari. No basta un latch en RAM ni el 202.

**Criterio de injerto mínimo completo:**
1. Hidratar estado del store (posiblemente asíncrono IndexedDB), antes de cualquier `submit` o retry; `ready` explícito; prohíbe volver silenciosamente a almacén RAM para comandar ventas.
2. Guardar un `prepared/sameDoLocked` durable ANTES de llamar `dispatch`; esperar `save` y tratar fallo de storage como fail-closed, sin POST ni legacy fallthrough.
3. Si el preflight de C15 demuestra que no se enviará HTTP -ops (issuer, validación, rol), limpiar ese preflight persisted entry y permitir legacy tras confirmar el remove, nunca si hay ambigüedad de storage. Si ya se tocó el DO, reenviar misma `opId` solo mismo DO.
4. Los estados/quarantine y `remove` son async-awaited cuando aplica; no eliminar de RAM antes del flush; persist-before-dispatch en cada reintento si cambia state.
5. TDD RED→GREEN con store async: write pendiente impide POST, write reject impide POST, crash durante POST después del commit y reload reintenta mismo opId con un solo negocio aplicado, issuer preflight limpio no deja cola, estado corrupto de store falla cerrado.
6. Conservar backoff acotado, single flight, marca de 409, compatibilidad con store síncrono y pruebas previas; CI SHA exacto + global.
7. Sin subir score del port hasta que exista cableado de venta productiva, aunque se fusionen salvaguardas en módulo; calidad puede cambiar solo con evidencia concreta.

**Pruebas locales Workerd/Node sintético y GitHub CI:** no crear servicios, buckets, bindings ni ejecutar R2; presupuesto nuevo autorizado USD 0,00. Buzón: https://app.notion.com/p/41d1642b67f38143817dd6548c55a31c
