# friendly-123 · P0 dashboard remoto · v0.7.88 comercial PUBLICADA · 18 nov 2026

## Estado verificable

- **LIVE root clientes:** https://jfcarpiopuntocom.github.io/friendly-123/dashboard.html
- **Origen:** https://github.com/jfcarpiopuntocom/friendly-123/pull/761, fusionada a `master`/ `estable` en **`4f1551717b9722d7c501566e43b60e41cb99f81c`**.
- **Rollback `previo`:** `e01d4755a72eb31eb581856a007718536548df31` (v0.7.87).
- **Evidence production GET, no cache:** `dashboard.html` HTTP 200 `f123-shell-v788`/`v0.7.88`; `version.json` HTTP 200 `cacheGeneration:golden324`; `dashboard-broadcast.js` HTTP 200 with encrypted Realtime adapter; `release-proof.json` HTTP 200 commit SHA exactly `4f155171...`.
- **[Post-release workflow 44359796502](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44359796502):** `probar-y-mover`, `publicar/construir`, `publicar/desplegar`, `recorrido/recorrer` SUCCESS. Its browser output: `Publicado: f123-shell-v788 (v0.7.88)`, `Chromium escritorio: Dashboard v0.7.88`, `Safari iPhone: Dashboard v0.7.88`.
- **PR candidate gates:** P0 Hotfix Gate SUCCESS, Release continuity SUCCESS, browser WebKit/Chromium two-tab sales SUCCESS, dashboard encrypted broadcast contract SUCCESS, synthetic two-Chromium challenge/negative PIN/positive Owner token/encrypted photo chunks SUCCESS, actual shell manifest + all hashes SUCCESS. PR head `8e0aed8bffd3570ca0b6280b06f7a28c5d3eb802` before squash.
- **Causa:** dashboard conectaba únicamente WebRTC; TURN compartido (ICE701) no producía candidatos cuando dispositivos se encuentran fuera de LAN. **Hotfix Ponytail:** carga el cliente Supabase Realtime ya instalado y difunde únicamente frames AES-GCM efímeros, con verificación Owner/Admin y token de foto mantenidos en handlers de `sync-realtime.js`; inventario, ventas, ledger, rol sin modificaciones. Source `docs/dashboard-broadcast.js` y `docs/ops/p0-dashboard-supabase-ephemeral-20261118.md`.
- **Riesgo/limitación:** navegador sintético autenticó con datos y PIN sintéticos; todavía no certifica el PIN y registros de la tienda real. La unión fría en canal Yjs continúa P0 independiente: historial gigantesco/padres faltantes ya desde v787. `recorrido/union-fria` en ejecución al completar este documento. No confundir despliegue/DOM+PIN QA sintética con convergencia real de todos los aparatos.
- **Firebase alternativa descartada:** `/dashboard/m` 401, escritura `/o` 200, DELETE 401 => sin retención acotada; Realtime broadcast efímero fue el transporte apropiado.
- **Operación:** panel `/previo/` conserva el shell anterior. P0 usuario solicita mensajes técnicos directos, cortos, con SHA/URL/prueba y sin justificaciones defensivas; regla ya en `AGENTS.md` y `CLAUDE.md` de este workshop.

## Remaining acceptance

1. Dashboard remoto con licencia/Owner PIN reales y tienda del dispositivo real, cifras y fotos completas.
2. Unión fría Yjs gran historial con `catalogoRecuperando=false`, sin faltantes causales y prueba física A→B→A.
3. Recorrido `union-fria` pendiente de resultado, mantener NO-GO solo para esa cualidad si resulta fallida; la interfaz v788 y canal sintético tienen evidencia independiente.

No datos reales se escribieron mediante pruebas; release a producción autorizado por usuario en conversación.