# C60 + C61 · mis­ma friendly-123, catálogo Yjs congelado seguro y puntuación fija

Fecha Ecuador: 20-nov-2026. Producto real: jfcarpiopuntocom/friendly-123. Workshop solo plan, QA y evidencia. Sync3 integrado, no se inventó otra app ni se cambió proveedor. Flags 2.0 QA OFF; GO comercial 0/6, físico PC Opera↔iPhone Safari/PWA 0/5.

## Resultado verificado en MASTER luego de source y score MERGED

| Indicador independiente (rubro fijo100,0) | C59 anterior | C61 oficial | Cambio |
| --- | ---: | ---: | ---: |
| Migración 1.0→2.0 de la MISMA friendly-123 | 91,5/100,0 | **91,8/100,0** | +0,3 |
| Calidad arquitectura | 78,7/100,0 | **78,9/100,0** | +0,2 |
| GO comercial | 0/6 | **0/6** | 0 |
| Prueba física dispositivos | 0/5 | **0/5** | 0 |

Read-after-merge de `docs/engineering/architecture-2-port-score.json` y `...quality-score.json` en `master`: score91.8 y78.9, peso grupos100,0 y restante migración8,2, assessedProductSha real fuente C60 **9e5986623b42dfe6b27f0cdcb96a6d3360fe6962** (puntuación C61 tiene otro commit). Fuente de puntuación real [PR #861 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/861), head final `92f631af9a72694b158d5d04348926eea5c1668b`, **11/11 GH CI GREEN**, producto master merge **340d410f6fced0b64eff31314af0dac7f9f7f2e6**; Cloudflare Workers Builds exact commit SUCCESS UUID **2247d688-e155-4d54-9ce9-b4f13aa9636d**.

## C60 funcional: falso conflicto por orden de claves de los campos públicos

[PRECODE C60 antes de editar](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-20-c60-frozen-catalog-field-order-cold-join-precode.md). Source real `cloudflare-yparty-worker/src/trusted-frozen-source.mjs` reconstruía Y.Doc fuente y proyectaba datos permitidos mediante el injerto maduro `projectPublicCatalog`. El test de igualdad previo usaba `JSON.stringify(sourceRow) === JSON.stringify(projectedRow)`. Con el mismo producto público válido pero orden inverso de propiedades, un SHA de fuente correcto y SHA pública independiente se rechazaba una unión fría auténticamente permitida.

**TDD RED fuente intacta:** [GH Actions 44717977111](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44717977111) suite 28 PASS /2 FAIL, precisamente las rutas v1 numeric y v2 manifest paged con productos públicos reordenados. El adversario con PIN `ownerPin` y costo privado seguía fallando cerrado.

**GREEN Ponytail:** reemplazar SOLO la comparación textual por mismo conjunto de claves públicas permitidas + igualdad de valores primitivos, después del proyector existente. [GH Actions 44718117414](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44718117414) **30/30 PASS** incluido rechazo de secretos, 0 FAIL/SKIP. [PR #860 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/860), head `4df23b91465af8a54f04054e7168b9dfa0cafdc4`, **15/15 workflows GREEN** incluyendo historia Workerd, catálogo R2 sintético, privacidad, Gate D, release, venta WebKit y gates 2.0; merge SHA funcional **9e5986623b42dfe6b27f0cdcb96a6d3360fe6962**. Cloudflare Workers Builds exact fuente **SUCCESS**, UUID **9491d0f5-3bd9-4cd0-b355-ec9ff2a02620**. No se tocaron Worker SQL, TPV, Sync3, ledger, fotos, clientes ni PIN.

## C61 score-only: presupuesto fijo sin doble crédito comercial

[PRECODE C61](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-20-c61-c60-frozen-catalog-score-fixed100-precode.md) antes de editar score. RED [GH Actions 44718851933](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44718851933): score oficial anterior 91.5, nuevo test esperaba91.8, fallo real `91.5 !== 91.8`. GREEN por último HEAD de PR #861 **11/11 CI**.

En grupo `frozen-history` original18,0 se descompuso el requisito pendiente `real-firebase-head-complete` 2,5 en **`c60-frozen-public-field-key-order-verified` 0,3 DONE (QA técnica fuente)** y **`real-firebase-head-complete` 2,2 PENDING real**. Binding R2 2,0 PENDING, sin crear buckets/servicios. Categoría calidad `durability`18,2→18,4/20 (+0,2), total78,9/100; las otras dimensiones sin cambio. Se mantienen 8,2 puntos port pendientes y 0/6 GO 0/5 físico. **No** es certificado Firebase HEAD ni dinero histórico.

## Siguiente seguridad: raíces Yjs desconocidas v1 y unión económica real

Al terminar C60 se descubrió que `readTrustedFrozenSource` aceptaba un documento legacy v1 de raíz `products` o una raíz desconocida si no había `productos`/`ubicaciones` (evadía la comparación allowlist por condicional). Este hallazgo fue registrado sin cobrarlo. Posteriormente otro injerto [PR #862 C62 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/862), commit fuente **6e802e6e0df0988922220dd634a40f7788638f05**, cerró esa ruta: `channel==='cat'` exige *solo* raíces `productos` y `ubicaciones` tanto v1 como v2; test adversario de `products`, `banco_privado`, `eventos`. Cloudflare exact commit SUCCESS UUID **06b63e28-43a4-481a-9722-ffd801f95f5b**. Su score separado [PR #863](https://github.com/jfcarpiopuntocom/friendly-123/pull/863) estaba en RED/draft durante esta auditoría, por lo que este reporte C61 NO le atribuye crédito anticipado.

Pendiente principal: Firebase RTDB HEAD real + checksum económico por opId, reconciliación con Yjs -ops y DO SQLite, R2 Service Binding real. Mantener reservas Notion; no tocar `docs/core/ledger.js` PR #841 de otro auditor. A→B→A×2 real PC/Opera↔iPhone/Safari sigue sin certificar.

**Cierre C61:** 91,8/100,0 migración y 78,9/100,0 calidad, rúbricas reales y separadas. Próxima puntuación C63 solo si supera CI y merge fuente C62 sin doble crédito.