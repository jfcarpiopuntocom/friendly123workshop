# PORT 2.0 · diagnóstico Cloudflare REAL contra ensamblaje workshop

**18 nov 2026 noche, Ecuador / 19 nov UTC.** Auditoría API **solo lectura** de la cuenta Cloudflare que contiene los scripts exactos `friendly123-licencias`, `friendly123-yparty-port2-canary-qa`, `friendly123-yparty-qa-20261114`. No se cambiaron bindings, secretos, flags, despliegues ni datos. Acceso comprobado mediante listado de Workers y descarga de sus scripts publicados, no inferido de otro account.

## Evidencias concretas (API Workers: GET scripts, settings, deployments)

| Servicio | Código publicado | Bindings existentes | Bloqueo |
| --- | --- | --- | --- |
| `friendly123-licencias` (Worker compartido de producción) | Script descargado ≈240.235 caracteres; **no contiene `/ws/ticket` ni `WS_AUTHORITY_QA`** | `LICENCIAS`, `REGISTROS`, secretos `WS_SIGNING_KEY`, `WS_SERVICE_KEY`, `TEAM_PIN_PEPPER` y otros ya presentes, confirmados **únicamente por nombre y tipo** | Faltan `TEAM_AUTHORITY_QA`, `TEAM_AUTHORITY_LICENSE`, `WS_AUTHORITY_QA`; el emisor desplegado aún no tiene ruta de ticket |
| `friendly123-yparty-port2-canary-qa` (Worker QA de arquitectura nueva) | Script descargado ≈377.557 caracteres; conoce `WS_AUTHORITY_QA` pero **no contiene `openExistingStore` / `WS_OPEN_EXISTING_QA` en el código**, es anterior al helper fusionado en workshop | Durable Object `Tienda`, KV `LICENCIAS`, Service Binding `WS_AUTHORITY`, secret `WS_SERVICE_KEY`. Seis flags `WS_AUTHORITY_QA`, `WS_BUSINESS_EXECUTOR_QA`, `WS_OPEN_EXISTING_QA`, `WS_PHOTO_BLOBS_QA`, `WS_SEPARATE_ROOMS_QA`, `WS_TYPED_COMMANDS_QA` **todos OFF** | Falta binding `SALA_PILOTO` requerida por `src/index.js`; el servicio QA no se puede usar aún para unir tienda |
| `friendly123-yparty-qa-20261114` | Worker QA **antiguo** aún publicado | `SALA_PILOTO`, `Tienda`, `LICENCIAS`, `LIMITE_PILOTO`; sin Service Binding `WS_AUTHORITY` | El cliente compilado del taller apunta a este host antiguo, no al canario 2.0 |

Los despliegues expuestos en la API son del 18-nov para emisor y canario, pero **una fecha reciente de despliegue NO significa que el nuevo código esté instalado**: la lectura directa de sus scripts confirma lo anterior. Valores de secretos/PIN nunca fueron leídos ni registrados. Una comprobación de la ruta HTTP pública mediante el navegador de búsqueda **no fue accesible** en esta sesión; no afirmar códigos HTTP actuales por esa vía. La nota Notion más antigua ya documentaba GET `/ws/ticket`→404 y Worker QA→503 el 18-nov; eso se mantiene como antecedente, no como sonda nueva.

## Mismatch de código que debe cerrar el próximo injerto

El `projects/assembled-v783/app/src/yparty-piloto.js` del taller fija `const host = 'friendly123-yparty-qa-20261114.jfcarpio.workers.dev'`. El componente integrado `openExistingStore.mjs` del workshop (`#116`, `#131`) **no está empaquetado en el Worker QA desplegado** ni conectado a `Tienda.onStart`. El emisor central tampoco contiene código `/ws/ticket`. Por tanto, actualmente no existe la ruta extremo a extremo para un `Owner PIN → ticket central → -cat YParty seguro → historial certificado → join frío → opId económico`. El hecho de que Workerd local pase no puede puntuar como GO comercial.

## Orden vinculante de ejecución Ponytail (sin parche 1.0)

1. Preparar una **instancia QA aislada y autenticada del emisor** con implementación real de `/ws/ticket` y scopes Owner/Team; comprobar que toma credenciales centrales y devuelve 401/403/405 correctos bajo tests negativos, manteniendo `friendly123-licencias` comercial intacto hasta autorización de promoción. No copiar ni imprimir secretos.
2. Alinear **host cliente del piloto** con el Worker QA 2.0. Recompilar **`app/docs/vendor/yparty-piloto.min.js` reproduciblemente** y pasar `photo-browser`, versiones y checks del SHA exacto; cambiar solo el código 2.0 y detrás de flag OFF. No publicar código fuente con bundle antiguo.
3. Proveer `SALA_PILOTO` **únicamente para la licencia QA de JFC** desde un contrato de identidad y room verificado, manteniendo los seis flags OFF mientras falte código/privacidad. Confirmar Service Binding y scopes sin exponer Y.Doc crudo `-cat` a Team.
4. Integrar fuente **independientemente certificada** de historial real (no `more:false` ni HEAD inventado) con `Tienda.onStart` tras demostrar 0 `pendingStructs/pendingDs`, SHA/vector, opIds, frames de todos los escritores; en cualquier 401, parentesco faltante o cuota, fallar cerrado y conservar origen. [Plan Gate D](../plans/2026-11-19-gate-d-current-yjs-workerd-onstart-integration-next.md).
5. Contraprobar con JFC en dos dispositivos reales Opera PC↔Safari iPhone A→B→A×2, dinero, stock, fotos y acceso. Recién después discutir flags y salida a clientes. El Workerd QA no se activa ni promociona por el mero hecho de tener bindings.

## Estado del corte
`friendly123workshop/main` lleva [Gate C post-PIN #130](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/130) y [Gate D reapertura verificada #131](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/131). Marcadores congelados: arquitectura **67.0/100**, port **61.0/100**, **0/6 GO**. No hay despliegue del ensamblaje 2.0 a clientes; nunca confundir CI de laboratorio con el Worker publicado.
