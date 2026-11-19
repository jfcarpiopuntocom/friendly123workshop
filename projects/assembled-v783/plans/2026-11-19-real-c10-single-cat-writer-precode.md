# PORT 2.0 APP REAL · C10 · catálogo un único escritor Workerd · PRECODE · 2026-11-19

## Fuente y alcance
Producto objetivo: `jfcarpiopuntocom/friendly-123` branch `port2/20261119-c10-single-cat-writer`, base `061b2eb7fc289ae861da38f4e65750062f9f6767`. El workshop solo registra el plan y las evidencias. Sin tocar Sync3, el cliente `src/yparty-piloto.js` ni `docs/sync-yjs.js` (reservados). No editar ni abrir el servicio Cloudflare vivo ni activar flags.

## Problema de causa raíz
PR #788 aisló catálogo público; PR #789 impidió pasar Y.Doc privado. Pero `Tienda.onConnect` todavía admite dos conexiones Owner con `cat:write` a la misma `-cat`; ambas pueden producir historiales conflictivos. Es una condición de seguridad necesaria ANTES del corte C8→cliente. No arreglar el esquema económico ni modificar transportes legacy en esta intervención.

## Cambio Ponytail mínimo
En el Worker de producto, en `onConnect` después de verificar centralmente el ticket y antes de `super.onConnect`, enumerar conexiones de ESA instancia de sala. Si una conexión distinta y actualmente autorizada tiene `cat:write`, cerrar la nueva conexión escritora con 1008. Clientes `cat:read` permanecen libres. No conservar una bandera en RAM que se desincronice con hibernación; usar estado vigente de conexiones. El Worker sigue comprobando scopes en cada mensaje. No ampliar `ops:sale` ni tocar su rechazo de Yjs crudo. Cuando el escritor se desconecta, un Owner con nuevo ticket puede entrar. Las salas no-cat mantienen conducta actual.

## TDD y criterios
RED en Workerd real: Owner A `cat:write` conectado; Owner B `cat:write` con ticket NUEVO no debe lograr segunda conexión; cualquier frame Yjs antes de rechazo = fallo. Un lector `cat:read` sí entra. GREEN tras parche: B recibe 1008 y 0 frames; cerrar A, C con token nuevo sincroniza y escribe; `ops` sigue rechazando raw Yjs. Ejecutar suites pertinentes de `cloudflare-yparty-worker/qa` y GH Actions sobre SHA fijo. Si la base de prueba no reproduce RED, detener parche y corregir harness, jamás fabricar GREEN.

## Estado de entrega
PRECODE; se actualiza sólo con URL PR, SHA, CI y resultados reales verificables. C10 es infraestructura server QA, no sustitución de ruta activa 1.0; el PORT no sube por esto y los seis gates comerciales siguen NO-GO. Falta source Firebase HEAD certificado, R2/pin/binding, emisor central, corte cliente y prueba física A→B→A×2.
