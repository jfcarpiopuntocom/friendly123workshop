# C54 · checkpoint duradero RED→GREEN · mismo friendly-123, no otro producto

**Fecha Ecuador:** 2026-11-19 (UTC GitHub/Cloudflare 2026-11-20).
**PRODUCTO** `jfcarpiopuntocom/friendly-123`; workshop solo retiene PRECODE, estado y pruebas. Sync3 se conserva.

## Línea base confirmada ANTES de C54

- App master tras PR #852 C53: `7c5f6637ceab125711da84bbd25b1152a79b5df3`, versión v0.8.22.
- Fijo: migración **90.0/100.0**; calidad arquitectura **78.1/100.0**; pendiente10.0; presupuesto100.0; GO comercial **0/6**, físico **0/5**. No activar QA flags.
- Registro de source REAL: `open-existing-store.mjs` ya contiene `mergeFrozenIntoExisting`, Gate D4 Workerd real prueba 10 locales + 100 congelados = 110, reinicio sin fuente. El informe Hermes de unión imposible está desactualizado.
- R2 Cloudflare: API autenticada reportó lista vacía de buckets; no se creó ninguna ni se cambió billing. Fuente real Firebase HEAD todavía sin certificar; no acreditar sus 4.5 pts. Ledger P0 [#841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) bajo reserva ajena.

## Root cause C54

En `docs/sync-yjs.js`, `usarRelayHabitual()` puede reasignar `API.canal = API.canalSombra` al fallar YParty piloto. El handler `API.doc.on("update")` llamaba incondicionalmente `API.canal.enviarUpdate(update)`, aun cuando `modoCorte20Activo=true`. C52 ya suspendió tres senders Yjs LEGADOS bajo corte 2.0, pero no el canal primario cuando es viejo. Riesgo de doble escritor en fallback.

**Ponytail:** `if (!API.modoCorte20Activo || API.canal === API.canalPiloto) API.canal.enviarUpdate(update);`. Sigue enviando al piloto 2.0; si primario cambia a sombra 1.0 durante 2.0, no publica; después de failback a flags OFF, el legado vuelve exactamente una vez. BC/IDB y Sync3 intactos.

- [PRECODE](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c54-primary-yparty-fallback-writer-fence-precode.md) grabado antes de modificar.
- [PR #853 C54](https://github.com/jfcarpiopuntocom/friendly-123/pull/853), CANDIDATE head `545cfe0da95da36c54e83d1f3f7e49de0a8c8ecd`, branch `port2/20261119-c54-primary-yjs-legacy-fallback-fence-v823`.
- **RED verificado** sobre cabeza `c5e658e35c27f900f93b2cfcb2e3df0cf1427b0a`: [Actions C52 run 44674545607](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44674545607), 20/22 PASS; uno rojo adicional por la falta de la guarda de fallback primario y otro por el chequeo textual anterior que fue preservado en test extendido. No confundir la falla textual con incidente runtime.
- **GREEN focal verificado** [Actions C52 run 44674801266](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44674801266) contra el source C54 corregido: nuevo piloto sigue publicando, antiguo canal primario no lo hace mientras corte2.0 activo, y old senders reanudan tras failback.
- Release candidato v0.8.23 shell v823/golden359; `docs/version.json`, `docs/dashboard.html`, `docs/sw.js` y `docs/version-manifest.json` sellados. Hash SHA256 `docs/sync-yjs.js` = `561d458c5abe256f46dde12f9e45f2247bd6498956f4512da0d9e4c525dec4ec`; hash `docs/dashboard.html` = `1917ea73064e8be2e4195817bc8f4162843ba4b44cf46b5550fc21476e164797`.
- **PR #853 CI:** al momento de este checkpoint 54/55 GREEN; falta browser inventory DOM parity Chromium/WebKit con instalación Playwright. **NO MERGE antes de green completo**. Cloudflare build del SHA de merge aún NO acreditado.
- Score candidato postmerge **90.5/100 implementation** / **78.3/100 quality**, si split 0.5 de `typed-delta-and-legacy-retirement` pendiente1.0 ya existente -> nueva capacidad fuente0.5 DONE y retiro integral/physical0.5 todavía FALSE; calidad +0.2 en migration. ¡No oficial ni acreditar ahora! GO0/6, físico0/5, Sync3 intacto.

## Siguiente acción finita

1. Releer estado CI exacto PR #853 y si hay 55/55 GREEN + mergeable true, fusionar.
2. Verificar Cloudflare Workers Builds exact master SHA success; actualizar la nota solo cuando esté confirmado.
3. Abrir score-only PR bajo presupuesto fijo100 con TDD RED→GREEN contra el master real ya fusionado, guardando el resto0.5 sin acreditar y métricas independientes. Fusionar solo con 11/11 greens y build Cloudflare exacto; actualizar Notion/workshop. No tocar cliente físico.

Sin nuevos proveedores, sin nuevas rutas, sin otros frentes abiertos.
