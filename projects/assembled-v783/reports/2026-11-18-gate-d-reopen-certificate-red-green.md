# Gate D · reapertura de historial certificado en YParty SQL sin ACK falso

**18 noviembre 2026 (Ecuador) / 19 noviembre UTC.** Workspace `jfcarpiopuntocom/friendly123workshop`. [PR #131 MERGED](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/131), `main@2642c417b698f20a7f756241a1da8724980ca25b`. Código fuente GREEN en commit `5fdcb8cd9c4409606e2f3ff946aeb39819be690f`. [Plan precode](../plans/2026-11-18-gate-d-cold-reopen-proof-precode.md). El port 2.0 sigue OFF para clientes.

## Evidencia de defecto y corrección
- Antes: `src/open-existing-store.mjs` devolvía `{opened:true,already:true}` si existía una sola fila en `f123_frozen_imports` aun cuando su SHA hubiera sido alterado. Un recibo SQL no acredita Yjs causalmente completo.
- RED fuente real Miniflare+Workerd/YServer/SQLite: [#44457961107](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457961107), **19/20**. Exactamente un caso falló: reapertura tras corromper certificado original en fixture QA. No se tocaron datos de clientes.
- GREEN: [#44458107021](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44458107021), **20/20**. La ruta already-existing compara el certificado con la fuente independiente (si está disponible), vuelve a exportar snapshot+diario SQL con `exportCompleteYpartyYjs` dentro de barrera de lectura consistente, revisa Yjs pendingStructs/pendingDs y la cantidad mínima de opIds para ops. Si falla, `opened:false` y failback; nunca borra contenido ni reimporta un historial distinto.
- Regresiones GREEN incluyen cold join sintético de dos escritores (hijos antes que padres), avance tras reinicio, vector diff idempotente, padre faltante rechazado y flag `WS_OPEN_EXISTING_QA` OFF.

## Alcance exacto y límites
- La certificación del origen Firebase HEAD real **no está demostrada**; auditorías Qwen/Gemini evidencian 19 padres causales y Firebase 401. Ninguna verificación SQL puede reconstruir operaciones independientes omitidas antes del corte ni sustituir un SHA externo previo. No usar snapshot-reset destructivo.
- El hook del importador para `Tienda.onStart` **continúa en la fixture QA**, todavía no conectado al `src/index.js` real. No existe un pipeline autorizado que permita afirmar que la tienda actual de Belén abre en Workerd.
- `synthetic-qa` amplia estuvo en progreso durante la fusión, así que NO afirmar «todas las CI verdes». Workerd focal exact-head 20/20 sí acredita el cambio. Código actual queda bajo flags OFF, sin cambio en producción `friendly-123`.
- El algoritmo verifica completitud causal y certificados presentes; **no** garantiza que la fila sea un anclaje inmutable frente a corrupción simultánea de base y certificado sin fuente externa. El `frozen_head` requiere prueba independiente del proveedor histórico, no un marcador autodeclarado.
- Score congelado: **calidad arquitectónica 67/100**, **port 61/100**, **GO físico 0/6**. Gate D permanece pendiente de conexión real y pruebas Opera PC↔iPhone Safari ×2. Un green de Workerd no aumenta score automáticamente.

## Próximo injerto causal
[Plan ya versionado para `Tienda.onStart` y fuente trusted](../plans/2026-11-19-gate-d-current-yjs-workerd-onstart-integration-next.md): fuente histórica original verificada externamente, corte bajo autorización central; hook una vez antes de `super.onStart()`, fail-closed y un solo escritor, rollback diff original. No admitir upload JSON de navegador ni Team en Y.Doc privado. Mantener identidad PIN+licencia, opId y readback de dinero como puertas distintas.
