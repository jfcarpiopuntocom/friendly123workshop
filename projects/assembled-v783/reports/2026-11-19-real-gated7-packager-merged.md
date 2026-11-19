# friendly-123 PORT 2.0 APP REAL · Gate D7 empaquetador de HEAD/Yjs → R2, MERGED · 19 nov 2026

## Producto real y prueba

- **Destino del PORT**: [jfcarpiopuntocom/friendly-123 PR #787](https://github.com/jfcarpiopuntocom/friendly-123/pull/787), **MERGED**; lectura GitHub master *después* del merge = `dd68d77335a02219b8e154d2efce21d0258811e7`, HEAD candidato `186f82653f741d2eec08663db7ee21d4aa18a6ff`, base previa `46856eb842c91db996b12291aba9f610c1d6bd51`. Archivo nuevo `cloudflare-yparty-worker/tools/frozen-r2-packager.mjs` confirmado por blob SHA `7e3acddabd237ce932fff8298a86bf95f05a37cb` en master.
- **15/15 check-runs GitHub SUCCESS** exact SHA de PR antes del merge; incluye seguridad, flujo integrado, dos pestañas, negocio y Worker.
- TDD [RED #44524616578](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44524616578) módulo no existía; [GREEN #44524896403](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44524896403) SHA `186f826`: **8/8** packager Node + **11/11** R2 Workerd/REAL Tienda regressions, 0 fail/skip/cancel. [Ponytail PRECODE guardado primero](../plans/2026-11-19-real-gated7-r2-packager-precode.md).
- **Autoría:** Sol6 implementa código en app real; OpenCode/Hermes auditor de solo lectura. Workshop es banco de pruebas/informes, nunca sustituto del PORT. Sync3 permanece.

## Qué injertó D7

`packFrozenR2Archive({room,channel,frozenHead,frames,externalProof})` es un **módulo Node offline** que genera `objects:[{key,body}]` para R2 pero no sube ni escribe nada por sí mismo. No posee credenciales, no consulta Firebase ni llama a Cloudflare.

1. **Ancla exigida** `externalProof.sourceHead===frozenHead`, `completeToHead:true`, SHA independiente de bytes originales ordenados con `uint32BE-length || frame`, expectedStateSha256, expectedVectorSha256, expectedOpIds en ops; rechaza discrepancias y Yjs incompleto (pendingStructs/pendingDs) y oráculos no coincidentes. **La autenticidad/COMPLETITUD del HEAD Firebase deben certificarse fuera del packager**; aceptar los campos no los vuelve mágicamente auténticos.
2. **Ops**: exige documento Yjs exclusivamente `eventos`, sin raíces privadas ni dinero/metadata de catálogo; **preserva los frames originalísimos byte a byte**, clientID y causalidad, reintentos exactos. Conflictos comerciales same-opId siguen protegidos en la unión SQL D4/D5.
3. **Cat**: parte del documento privado solo para proyectar `productos` y `ubicaciones` a un nuevo Y.Doc detached (versión determinista `v1`), aplica allowlist de display; no incluye `_meta`, PIN, costos, bancos, contactos ni hechos privados en objetos R2. Cat sigue siendo un snapshot público de lectura, NO fuente de escrituras comerciales.
4. **R2**: manifest y páginas exactas siguiendo API Worker D6. SHA de página sobre frames length-prefixed, SHA raíz indexada `chunk:pageSHA\n`, contigüidad firstFrameIndex/frameCount, base64 canónico y manifiesto bytes exactos con SHA retornado como `manifestSha256` (pin fuera R2). Limita 12MiB ops / 24MiB cat, hasta 8 páginas, 4096 frames/página y 4MiB JSON/página; límites por llamada solo se estrechan.
5. **GREEN end-to-end** carga los objetos producidos a R2 **sintético de Miniflare**, y el Worker real D6 los lee con pin externo, pasa el lector Gate D del producto y `prepareFrozenImport` recupera todos los 100 opIds con SHA exacto.

## Estado general tras D6+D7

- [D6 PR #786](https://github.com/jfcarpiopuntocom/friendly-123/pull/786) código real de fuente R2 Service Binding y [D7 PR #787](https://github.com/jfcarpiopuntocom/friendly-123/pull/787) código real de preparación de archivo R2: ambos **MERGED**.
- **Faltan datos históricos reales certificados** de Firebase y alcance causal; canario anterior registró 19 padres Yjs y 9 respuestas 401. No producir salida de R2 ni declarar completitud sin corte externo verificado.
- Worker QA Cloudflare sigue con seis flags OFF y `WS_FROZEN_HISTORY_SOURCE` sin binding (consulta read-only posterior a D6). No se tocó Cloudflare ni datos de clientes.
- `src/yparty-piloto.js` conserva guard #765 para evitar salida de doc privado `_meta`, costo/finanzas al Worker; por eso arquitectura 1.0 relay sigue en la ruta activa. No confundir **código ensamblado y versionado** con **ruta 1.0 reemplazada**. El objetivo 80% exige hitos activados y prueba de convergencia física, no contar PRs.
- Próximo paso causal: proceso forense/HEAD Firebase completo, entregar datos inmutables a R2, configurar secretos/pins + binding QA, y **puente de catálogo público separado** para que el navegador nunca transporte un Y.Doc privado a Worker. Después canario 1 licencia, pruebas reales Opera PC ↔ Safari iPhone A→B→A ×2 y veredicto GO/NO-GO.

**Números publicados sin falsear:** rúbrica operativa antigua 61/100, calidad arquitectónica 67/100, aceptación comercial 0/6; estos números NO son porcentaje actualizado de código 1.0 retirado ni pueden usarse para afirmar 80.
