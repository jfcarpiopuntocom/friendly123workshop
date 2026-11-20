# C60/C61 · Friendly-123 MISMA APP: historial público Yjs protegido contra rechazo por orden de propiedades

2026-11-20 Ecuador. Producto `jfcarpiopuntocom/friendly-123` master **340d410f6fced0b64eff31314af0dac7f9f7f2e6**, versión app v0.8.24 shell v824 sin cambio de shell C60; laboratorio `jfcarpiopuntocom/friendly123workshop` solo plan/evidencia, no producto. Sync3 intacto, 2.0 QA OFF, no clientes ni gastos R2.

## Indicadores independientes, presupuesto original100,0

| Indicador | Base C59 | Resultado oficial C61 | Incremento |
| --- | ---: | ---: | ---: |
| Migración arquitectura1.0→2.0 MISMA app | 91,5/100,0 | **91,8/100,0** | +0,3 |
| Calidad arquitectónica | 78,7/100,0 | **78,9/100,0** | +0,2 |
| GO comercial | 0/6 | 0/6 | 0 |
| Dispositivos físicos PC Opera↔Safari/PWA iPhone | 0/5 | 0/5 | 0 |

Read-after-merge desde fuente JSON real friendly-123/master: score migration91.8, assessedProductSha **9e5986623b42dfe6b27f0cdcb96a6d3360fe6962**, pesos sum100.0 y pending8.2; calidad78.9 con durability18.4 previo18.2, previous total78.7; seguridad10.7, sync15.9, physical0. Rubrica frozen-history18: c60-frozen-public-field-key-order-verified QA0.3 DONE source `cloudflare-yparty-worker/src/trusted-frozen-source.mjs`, real-firebase-head-complete **2.2 PENDING**, r2-service-binding-installed **2.0 PENDING**. La prueba no pretendió certificar HEAD Firebase de clientes.

## C60 TDD red-green source funcional

- [PRECODE antes de modificar source](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-20-c60-frozen-catalog-field-order-cold-join-precode.md). Fuente real `cloudflare-yparty-worker/src/trusted-frozen-source.mjs`, función `validateDocument`: comparaba `JSON.stringify(source.get(id))` con `JSON.stringify(row)` de la proyección pública desprendida `projectPublicCatalog`. Dos objetos con los mismos campos/valores permitidos e idéntica prueba de hash fallaban solo porque el orden de claves JSON difería.
- [C60 RED Actions 44717977111](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44717977111): **28 PASS / 2 FAIL**, precisamente valid public keys reordered v1 numeric y v2 paged independent projected SHA. Caso con `costo` y `ownerPin` sintéticos sigue rechazado.
- Fix mínimo comparó conjunto EXACTO de claves permitidas + valores primitivos idénticos, en lugar de texto JSON; mantiene proyección whitelist y defensa ante campos extra. [C60 GREEN Actions 44718117414](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44718117414): **30/30 PASS**, 0 fallos/omitidas, 3 nuevos casos incluyendo PII negativas.
- [PR #860 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/860), candidato HEAD `4df23b91465af8a54f04054e7168b9dfa0cafdc4`, **15/15 GitHub workflow GREEN** (historial, Gates D, Workerd/Miniflare, P0 finanzas, v1/v2, release, Chromium/WebKit). Código en misma app merge **9e5986623b42dfe6b27f0cdcb96a6d3360fe6962**. Cloudflare Workers Builds exact SHA **SUCCESS** uuid `9491d0f5-3bd9-4cd0-b355-ec9ff2a02620`.

## C61 score-only auditado

- [PRECODE score](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-20-c61-c60-frozen-catalog-score-fixed100-precode.md). [RED GH Actions 44718851933](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44718851933): `91.5 !== 91.8` contra score previo 91.5 real. Solo después se repartió **0,3** del original pendiente HEAD2.5 en subcapacidad probada y restante HEAD2.2, sin mover pesos.
- Calidad `durability` 18.2→18.4/20, `security`10.7, `sync`15.9 y `physical`0 intactas. Arreglada aserción histórica C52 que seguía esperando score18.2 en vez de18.4. El script de score exige código real de comparación clave/valor, tres regresiones C60, fuente exact SHA merge, hist peso18 y GO0/6.
- [PR #861 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/861), candidato HEAD `92f631af9a72694b158d5d04348926eea5c1668b` **11/11 CI GREEN** incluidos C12/C30 y P0, master score-only **340d410f6fced0b64eff31314af0dac7f9f7f2e6**, Cloudflare Workers Builds exact SHA **SUCCESS** uuid `2247d688-e155-4d54-9ce9-b4f13aa9636d`. Score official read after merge 91.8/78.9.

## P0 privacidad pendiente, sin esconderlo

`trusted-frozen-source.mjs` en ruta LEGACY numeric valida roots prohibidas por blacklist, pero si un Y.Doc trae SOLO raíz no reconocida y ninguna `productos`/`ubicaciones`, no ejecuta la allowlist de roots. Ejemplos antiguos QA `products` y `eventos` en -cat permitían falsos positivos; debe rechazarse toda raíz privada o no esperada en otra PR con migración de fixtures para Workerd, y mantener `ops` en sala exclusiva. C60 NO corrigió este problema y NO le sumó ningún punto por ello.

Los pendientes principales siguen: certificado HEAD Firebase completo verdadero de historia + economía y causalidad2.2, R2 Service Binding real2.0 (total4.2), físicos PC/iPhone A→B→A×2, GO0/6; ledger PR #841 reservado. NO confundir la simulación con tiendas ni atribuir doble crédito.