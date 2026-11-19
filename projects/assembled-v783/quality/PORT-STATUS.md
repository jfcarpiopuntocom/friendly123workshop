# friendly-123 · DOS MÉTRICAS /100 · 18-nov-2026

Fuente ejecutable de la calidad: [score-v1.json](score-v1.json) + [score.cjs](score.cjs). Fuente independiente de **culminación del port**: [port-v1.json](port-v1.json) + [port.cjs](port.cjs). Los pesos/stages y **seis gates aprobados JFC/Opus están congelados**, no se mueven por necesidad de ingeniería. Este marcador mide **hitos con evidencia**: los decimales no son probabilidades ni porcentaje de horas trabajadas.

## Gate C2 · +4 al PORT (18-nov), NO-GO comercial
[PR #128](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/128) integrada en main@86d33c3. Fuente `d31388d96afcadc23affbfce858ed37c2937c5cc`: [RED 22/24](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44453002009) → [GREEN 24/24](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44454217429), dos navegadores nativos Chromium↔WebKit. Bajo puente HTTP SHA QA, una foto permanece en IndexedDB desconectado, revive tras recarga, se confirma por SHA y Yjs sólo conserva `{sha,bytes,tipo}`. C2 +4, C total 7/10, PORT 61/100; no se acredita C3 (PC/iPhone físico), calidad 67/100 o un gate GO (0/6). Bridge todavía se inicializa antes de `oc-login` y puede ser nulo en arranque frío: próximo injerto de activación perezosa, proyección segura y readback. Esta prueba no certifica fotos de Belén en clientes reales, ni publicación comercial.

## Comparación auditada

| Métrica | Hace una semana | Corte anterior 17-nov | Actual 17-nov | Meta |
|---|---:|---:|---:|---:|
| Calidad y robustez arquitectónica | 45.0/100 estimado retrospectivo (±5) | 66.5/100 | **67.0/100** (±4 criterio; candidato combinado QA) | ≥95 |
| Culminación del PORT operativo | Sin rúbrica histórica (no inventar) | 57.0/100 | **61.0/100** (Gate C2 SHA-only probado en Chromium↔WebKit, sin clientes) | 100 **y 6/6 gates** |

Calidad +22.0 puntos estimados frente al 10-nov (45.0→67.0); puntuación ingenieril de **candidato QA**, no indicador de disponibilidad física. Port +34.0 **desde la primera medición versionada (27.0 el 17-nov)**, no inferir avance semanal. **Comercial 0/6 gates certificados. NO-GO**. La primera tienda solo puede activarse tras las seis condiciones aprobadas por JFC y el score de calidad ≥95.

## P0 Gate A · +16.0 al PORT solo en candidato PR #115 (QA Workerd, NO LIVE)

**Criterio congelado:** stages `typed-sale-commit` 5, `typed-adjust-commit` 4, `typed-payment-commit` 4 y `business-committed-ack` 3; gate A 4→20/20, port 41→**57/100**. Sin pesos ni gates nuevos; **0/6 certificados, NO-GO**. [CI exacta 44248299332](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44248299332) SHA `8dd7bacf20be8f5c827e83111a6561bdb9394999`, 12/12: el router real `src/index.js` aplica venta, ajuste y cobro con recibo `business-committed`; replay = mismo recibo tras reinicio; empleado cobra y no ajusta (403); cobro mayor al saldo se revierte; bandera `WS_BUSINESS_EXECUTOR_QA` OFF = 202/503 anterior. [RED del marcador](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44248483003) esperaba 57 y calculó 41. Línea base sintética sembrada solo en prueba: la migración real Firebase→DO sigue pendiente.

## P0 Gate A · +16.0 al PORT (18-nov, main@fc5129d)

PR #112 (ajuste `stock.adjust` tipado), #113 (cobro/abono a fiado tipado + `ops:adjust` Owner/Admin) y #115 (router real aplica venta, ajuste y cobro con recibo bajo `WS_BUSINESS_EXECUTOR_QA`, OFF por defecto; `ops:payment` Owner/Admin/Team por decisión de JFC) fusionadas. Gate A 4→20/20; port 41→**57/100**, calculado con `node port.cjs` sobre main. Base comercial sintética sembrada en pruebas; **0/6 gates certificados, NO-GO**; nada activado en producción.

## P0 Gate E · +5.0 al PORT solo en candidato PR #97 (QA nativo, NO físico)

**Criterio congelado:** stage `idb-outbox-web-locks` 0→5/5, gate E 3→8/10; total port 36→**41/100** y calidad **67/100 sin cambios**. Ninguna nueva etapa, ningún peso nuevo; **0/6 gates certificados, NO-GO**. `port-v1.json` identifica el commit exacto de fuente probado `b864461e804b4b0fda28beb019d68a9a216082b9`.

[PR #97 MERGED workshop](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/97), [CI 4/4 GREEN](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44220487700), artefacto `gate-e-native-idb-44220487700`; CI ejecutó SHA de merge PR `5400d07ff68631608210d7f7abe2aaf633092975`, parte del candidato `b864461e`. Dos pestañas de mismo origen con IndexedDB real, funciones V2 extraídas de `app/docs/sync-yjs.js` SIN editar, ambos motores nativos Chromium y WebKit Playwright: carrera A/B, ACK A mientras B incorpora C, tercera apertura fría recupera solo B/C y tombstone A, cierre de DB no emite éxito ni pierde el pendiente. Se probó tanto Web Locks como la ruta atómica sin Locks, **cero FAIL, cero SKIP**. Además, [QA del ensamblaje](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44220487680) completó verde en el mismo head; esto no demuestra el histórico físico.

[RED primero, marcador esperaba 41 y computó 36](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44220915090): fallaron las aserciones de 41 y gate E 8 antes de incorporar la evidencia JSON. El test es independiente del código comercial, que no cambió. La PR #97 fue fusionada por squash en workshop/main@2f3c34ed45f1db9cdadf039022fe8bd2a5edb58c. El marcador 41/100 ya es oficial de main, PERO la CI histórica completa aún no demuestra GO: la corrida de PR #97 fue CANCELLED, y la auditoría post-merge está pendiente. No se habilitan flags ni producción; WebKit Playwright NO es iPhone Safari. La reserva `sync-yjs.js` quedó intacta.

## Calidad 67.0/100 · foto SHA real de cliente→emisor→Workerd, no certificado físico

El eje de calidad **fotos/PWA** pasa 6.0→6.5/10 (+0.5), exclusivamente para el **candidato combinado de PR93**. [CI Workerd 13/13](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44202469976) SHA `9ead72edbf4a088147ac62ae082d6aee46313433`: cliente real `createPhotoShaBridge` con emisor HMAC Owner central y token 1-uso subió una imagen sintética >2MiB al SQL de Durable Object, publicó referencia `{sha,bytes,tipo}` a Yjs de catálogo que recibió otro YProvider, reinició Workerd y nuevo cliente descargó y verificó MIME/SHA exactos. Solo se simularon el transporte de URL navegador hacia Miniflare y los datos/PIN de identidad; **NO iPhone físico**. Los ocho blobs del agente foto fueron copiados sin editar byte ni modificar su rama reservada.

El índice de calidad pasó RED [66.5!=67.0](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44202908908) a [GREEN 67.0](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44202983982), rubric 7 ejes/100 pesos inalterados. Calidad **67.0±4** vs baseline retrospectivo **45.0±5** hace una semana, +22.0.

**Fotos por sí solas no aportan puntos al port; port global actual 41.0/100, 0/6 GO**, pues `sync-yjs.js` sigue con `fotosDoc` Yjs de fallback si HTTP falla; falta probar no insertar blobs nuevos en Yjs bajo desconexión y recuperarlos desde un outbox durable y verificar PC Opera↔Safari iPhone. Este experimento NO da por certificado `yjs-sha-reference-only` 0/4 ni `photo-restore-cross-device` 0/3. Ninguna bandera o app real activada, producción sin cambios.

## Revisión calidad 66.5/100 · unión fría en ráfaga, NO físico

El eje **sync** existente avanza 12.0→12.5/20 (+0.5) únicamente por [TDD Workerd RED 11/12](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44200433269) (timeout tras 7,5 s debido a 250 ms por comprobación de cada frame) y [GREEN 12/12 sobre fuente real](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44200699627) SHA `151b3b2b1b0a34c6873c56a090bf0eb461ca667e`: 64 cambios Yjs firmados y completos en segundo YProvider con lotes de máximo 32 frames, verificando centralmente permisos/revocación por lote. La prueba duró ~334 ms, **solo se retrasó artificialmente el endpoint check individual**, no check-many; no equivale a tiempo de Firebase ni al iPhone físico.

[RED del marcador](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44200921547) calculó 66.0 cuando esperaba 66.5 antes de editar JSON. [GREEN del marcador](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44201003228) recalculó 66.5/100 sin tocar los pesos ni seis gates. Calidad 45.0±5 retrospectivo hace una semana, actual **66.5±4**, +21.5. **Port sigue 36.0/100 y GO 0/6**: todavía faltan negocio real, unión física y Firebase sin 15 padres pendientes. Producción intacta.

## Revisión de calidad 66.0/100 verificada en Workerd (17-nov, no port GO)

No cambiaron ejes, pesos ni seis gates. **+0.5** en durabilidad (16.0→16.5/20) por [Workerd SQL 3/3 con reintento queued→applied, reinicio y rollback](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44196026710); el ejecutor final es **sintético y no está conectado a la caja**. **+1.0** seguridad (7.5→8.5/15) por [denegación de Team al catálogo privado](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44193649188), [Team tipado y revocación 10/10](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44195009756) y [CORS exacto HTTPS con ticket intacto 11/11](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44199112764). **No** aumentaron negocio, sync, fotos, migración ni físico.

[TDD marcador RED esperado](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44199685238) calculó 64.5 frente a 66.0 antes de actualizar JSON; [GREEN real calidad/Workerd](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44199783940) pasa con `score-v1.json` anclado al SHA `1fc46eb8ee4b1d54cee0aceb473574cae72ed75b`. **Port 36.0/100; 0/6; NO-GO**, no despliegue. `WS_TYPED_ORIGIN_QA` exige el origen HTTPS de la tienda *configurado explícitamente*; si falta, la petición de navegador falla cerrada. Nada de esto acredita venta aplicada ni una sola unión fría física.

## Rubros de port (100 puntos exactos, inmutables)

| Gate JFC/Opus | Máximo | Hitos comprobados | Restante |
|---|---:|---:|---:|
| A. Empleado denegado raw Yjs; venta, ajuste, cobro tipados opId con ACK comercial | 20 | **20.0** | **0.0** |
| B. Emisor Owner/Team; ingreso firmado por canal y reconexión; revocación | 20 | **16.0** | **4.0** |
| C. Foto como blob SHA fuera de Yjs | 10 | **7.0** | **3.0** |
| D. Firebase→DO→Firebase completo, SHA, sin padres pendientes | 25 | 10.0 | 15.0 |
| E. Web Locks outbox y recuperación iPhone | 10 | 8.0 | 2.0 |
| F. Dos ciclos físicos Opera PC↔Safari iPhone A→B→A | 15 | 0.0 | 15.0 |
| **TOTAL** | **100** | **61.0** | **39.0** |

### C1 · foto SHA Workerd SQL +3/100 acreditado (NO gate C completo)

[PR89 Workerd real](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/89), [CI exacta 44160604233](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44160604233) SHA `f76deabc271b73702619992155b4a33d114119b4`: bloques SQL de 512 KiB con foto >2 MiB sintética, PUT/GET autenticado por tickets Owner, SHA validado, reinicio Workerd y recuperación binaria, foto **nunca** aceptada como sala Yjs WebSocket en esa ruta. Se acredita exclusivamente stage `photo-sha-sql-blob` (+3.0); NO acreditar referencias Yjs `fotos_refs` ni recuperación PC-iPhone hasta pruebas del navegador/equipo exactas. La rama foto browser sigue fuera de main y no se activa comercialmente. La calidad **se mantiene 64.5**, GO **0/6**; el [TDD RED del marcador](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44176289376) mostró 33 frente a 36 esperado antes de cambiar JSON. PR92 mantiene contraprueba de privacidad Team RED 7/8: no fusionar ni activar Team sin aislamiento.

### Avance material del port: dos injertos previamente importados ahora están cableados

**PR86** [Workerd 4/4](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44150775169) y [585/585 integrada](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44150993853), SHA `f01ef2f11fef1e6b83c955ac081db192b9f944cc`. Worker actual admite separadamente `-cat` y `-ops` bajo bandera QA de servidor `WS_SEPARATE_ROOMS_QA=1`. Ticket de un solo uso consumido en la autoridad central. `ops:sale` **no** habilita actualización económica Yjs arbitraria; catálogo requiere `cat:write`; sala `-priv` anterior sigue compatible. **No activar la bandera ni modificar producción sin seis gates**.

**PR87** [cliente/vendedor compilado 9/9](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44153648394) y [585/585 integrada](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44153648286), SHA `1db297d2387d389b2b2b05e6191133c52b7b4ebd`. El auténtico `app/src/yparty-piloto.js` usa `AuthorizedYProvider` más `createOwnerTicketParams` con el PIN Owner de sesión (no guardado), un `cap` nuevo por socket y por reconexión. Salas `cat`/ `ops` separadas; `fotos` conserva relay legado cifrado hasta salir del documento Yjs. El **vendor que carga `sync-yjs.js`** `app/docs/vendor/yparty-piloto.min.js` fue recompilado desde fuente con el lock existente y coincide byte a byte en CI; SHA256 `19c19f71868eeac94adaf9f656877a484cbdb6c05e0a1ea79987e6a1d8c88a68`.

Se acredita **solo** el stage *browser-fresh-ticket* **+6** de la etapa B, definido antes del trabajo. **NO se certifica el gate B**: falta probar Owner/Team real, revocación, y el flujo económico tipado. Las pruebas de navegador sintético del proveedor+Workerd y el código cliente recompilado son evidencia de laboratorio; **no** reemplazan pruebas del piloto completo en un iPhone real.

### Incompatibilidad vieja y corrección de diagnóstico

El validador antiguo `port.cjs:inspectClientWire` exigía indebidamente una sala única `-priv` para tres Y.Doc independientes, y seguía diciendo BLOCKED incluso después de PR86/PR87. El contrato correcto es Y.Doc `cat` y `ops` en rooms autorizadas separadas; `fotos` nunca debe fusionarse en esa sala económica. [PR88](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/88) añade RED→GREEN para reconocer sólo ese contrato sin aceptar una mezcla insegura de documentos.

### Lo que bloquea la **primera tienda** (únicamente los seis gates originales)

El Worker todavía no ejecuta venta/ajuste/cobro tipados con efecto comercial durable y **ACK de hecho aplicado**: el inbox actual entrega `stored-for-application`, no éxito de caja. Hay almacenamiento externo SHA en Worker probado, pero las fotos como bytes siguen en Yjs legado y todavía falta puente completo del navegador. Falta importar la historia **Firebase real** de 5.348 frames sin 15 padres pendientes y un rollback cifrado verificado; no sirve omitir `pendingStructs`. Outbox del transporte y iPhone deben superar Web Locks y suspensión física, y faltan dos ciclos A→B→A de Opera PC y Safari iPhone. Ningún otro requisito se añade aquí.

## Comandos de control, fail-closed

```sh
node projects/assembled-v783/quality/score.cjs
node projects/assembled-v783/quality/port.cjs
node --test projects/assembled-v783/quality/port.test.cjs projects/assembled-v783/qa/p0-port-client-worker-contract.test.cjs
# Retorna 2 hasta tener 100/100 port, calidad >=95 y seis gates de JFC verdaderamente certificados.
node projects/assembled-v783/quality/port.cjs --require-operational-go
```

**No ejecutar deploy ni activar `f123_yparty_qa`/ `WS_SEPARATE_ROOMS_QA` en cliente real todavía.** El desarrollo y su progreso se registran únicamente en `friendly123workshop`; producción `friendly-123` queda intacta.
