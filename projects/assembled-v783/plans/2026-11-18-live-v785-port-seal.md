# Plan de sellado 2.0 QA v785

## 18 nov 2026 · PLAN ANTES DE CÓDIGO · sellado v0.7.85 de PORT LIVE, sin deploy

Base de ensamblaje: [PR #751](https://github.com/jfcarpiopuntocom/friendly-123/pull/751) `claude/port-2-0-interruptor@3a832ca0f08793dccdf4c283687a303867e3c205` (dentro de `friendly-123`, NO el dashboard aislado, NO los datos). Dueño Opus: no escribir su rama. Repo persistente de planificación: `jfcarpiopuntocom/friendly123workshop`; cambios fuente en una rama apilada propia en LIVE. Prohibido tocar tiendas, sus datos, PIN, Service Worker publicado o producción por merge prematuro.

### RED observada
- [P0 Hotfix Gate PR #751](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44258655428) y [Release continuity gate](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44258655348) rechazan exactamente: `changed runtime requires a new increasing shell; do not reuse canary identity`.
- Opus dejó v0.7.84, `f123-shell-v784`, `golden320`, aunque `sync-yjs.js`/Service Worker han cambiado; no se debe publicar con esa identidad.
- `docs/vendor/yparty-piloto.min.js` en PR #751 es Git blob `90b672a06...` mientras las fuentes `src/yparty-piloto.js`, `src/authorized-yprovider.mjs`, `src/photo-sha-bridge.mjs` y compilador son byte-identical al taller main que generó bundle Git blob `fef27c970d...`, SHA-256 `ae285562efa80db95d09d0aa74296e0ec395df80a0654a8e1b4488dcf00993f3` en [photo-browser CI](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44252859802). PR taller #118 ya corrigió el bundle y pasó `photo-browser` y `synthetic-qa`.

### Ponytail completo de sellado (CINCO archivos + nuevo CI)
1. Crear rama propia basada en el SHA exacto de PR #751; modificar `docs/sw.js`: `CACHE` v784→v785, `CACHE_GENERACION` golden320→golden321 (sin cambiar operaciones SW), conservar comentarios históricos y entradas del SHELL.
2. `docs/version.json` v0.7.84→v0.7.85, `releaseName`, `shell` v785 y `cacheGeneration` golden321, changelog exacto y honesto: port QA OFF, no activación/producción ni promesa de datos migrados. Nunca `requerida:true` por este trabajo.
3. Reemplazar SOLO bundle `docs/vendor/yparty-piloto.min.js` por el blob compilado REPRODUCIBLE del taller main `fef27c970d...` y verificar coincidencia al terminar.
4. `docs/version-manifest.json`: algoritmo determinista del script oficial `scripts/gen-manifest.js`; sin sello horario, cambiar version/shell y SHA-256 del bundle exacto; **dejar hashes de todas las otras 126 rutas sin cambios**. La CI debe ejecutar el generador oficial y exigir `git diff --exit-code`, si difiere, no merge.
5. Añadir workflow QA de sellado con `npm ci`, `node scripts/gen-manifest.js`, `bash check-sw.sh`, pruebas de bundling/piloto/bridge, y comparación de nuevo shell con master si es posible; cero red real ni usuario real. Nada de tocar `docs/sync-yjs.js`, `cloudflare-worker/` ni `cloudflare-yparty-worker/` que tiene otros dueños.
6. Emitir PR draft APILADA sobre #751, **no fusionar ni desplegar** sin controles y sin la autorización operacional. Después de pasar CI, informar a Opus/Sol6 para incorporación sin conflictos. PR #752 independiente tiene config Worker QA OFF y puede integrarse por orden sin colisión de archivos.

### Gates de salida
- G5 licencias, manifest real y CRC de shell, P0 Hotfix Gate, Release continuity, CI backend YParty + tests de bridge; todos verdes al SHA exacto.
- PR apilada/manifest NO equivale a app 2.0 comercial: faltan Worker/issuer QA configurados, cold join real catálogo y pruebas A→B→A PC–iPhone, acciones tipadas de dinero con recibo business-committed y 6 gates sin inventar scores.
- **Rollback**: solo eliminar los commits del sellado/código antes de publicar; no borrar caches, histórico ni IDB ni forzar regeneraciones de tiendas. Con bandera OFF en docs/sync-rollout.json toda tienda permanece en legado.
