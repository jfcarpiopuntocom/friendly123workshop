# APP REAL · PORT 2.0 C11 · certificado de catálogo congelado para corte del navegador · PRECODE (19 nov 2026)

## Motivo / encaje en el PORT
Arquitectura 1.0 sigue operando en navegador; C8 copia privada→pública, C9 blinda el WS y C10 impide segundo escritor. Falta un modo NO AUTODECLARADO de que el navegador sepa que la sala -cat recuperó **realmente** un HEAD histórico completo antes de autorizar su primera publicación. Import/SQL certificado ya existen en el Worker de app real; usar ese resultado, no duplicar el importador ni creer un head local. Sync3 permanece intacto.

## Alcance único / propiedad de archivos
Producto `jfcarpiopuntocom/friendly-123`, base `7444246379706a50ba58673c6d9b359acea35820`, rama `port2/20261119-c11-certified-cat-proof`. Nuevos `cloudflare-yparty-worker/src/catalog-frozen-proof.mjs`, `cloudflare-yparty-worker/qa/p0-c11-certified-cat-proof-workerd.test.mjs`, workflow focal; cambio quirúrgico en `cloudflare-yparty-worker/src/index.js` solo routing HTTPS GET y onRequest. No tocar `src/yparty-piloto.js` ni `docs/sync-yjs.js` reservados, no generar shell/vendor ni desplegar/encender flags. Workshop solo PRECODE y evidencia; Notion bitácora.

## Contrato de extremo a extremo 
Un GET HTTPS `/parties/tienda/{room}-cat?frozen-proof=1` solo responde certificado si el Worker ya realizó import frío y validó certificado persistido `f123_frozen_imports` mediante Gate D, con SQL reabierto desde diario real y **documento público puro** (allowlist C9).
- Autorización: emitir un ticket Owner de un uso `cat:read` por emisor central; recibirlo vía header `Authorization: Bearer`, `X-F123-License`, `X-F123-Instance`; consumirlo centralmente `askAuthority(...,'consume')`. No PIN ni cap en URL/response/logs.
- CORS: origen HTTPS único configurado `WS_CATALOG_ORIGIN_QA`, preflight exacto GET + headers; origen extraño falla 403 *antes* de consumir ticket; sin origen solo cliente interno autorizado.
- QA: exigir las flags existentes `WS_AUTHORITY_QA=1`, `WS_OPEN_EXISTING_QA=1` y `WS_SEPARATE_ROOMS_QA=1`; no añadir nuevo flag universal.
- Respuesta `{ok:true,room,channel:'cat',frozenHead,stateSha256,vectorSha256}` desde fila SQL verificada; sin catálogo/cliente/finanzas/contactos. Cache no-store.
- Cualquier catálogo con `_meta`, precios no válidos o pendientes Yjs aborta, no se vende como público. Faltante/no certificado devuelve 503.
- No cambiar emisión de tickets ni Write/ACK económico; esto es SOLO una precondición del corte y no equivale a activar 2.0.

## TDD RED→GREEN / gates
Añadir prueba real de *Tienda* en Miniflare Workerd con autoridad central sintética y fuente pública synthetic frozen; preflight CORS, missing/replayed token, C9 private doc refused, recibo correcto desde SQL y cold restart sin reimport. Run RED verificando ausencia inicial GET 200; parche mínimo; GREEN con SHA exacto y regresión 211-test Worker + check release. Sin cambio flags Cloudflare ni tienda real. No elevar PORT activo /100 por el mero endpoint: permitirá al cliente verificar el HEAD antes de cablear C8.

## Observación de seguridad
El resultado de un GET no es un permiso para mezclar el Y.Doc privado con el público ni reemplaza el ACK durable de operaciones. Debe usarse para desbloquear solo el publisher de catálogo con fuente y rol certificados, y se debe abortar si el HEAD cambia durante emisión.
