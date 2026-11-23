# SPEC CONGELADA + SCOPE LOCK · `friendly-123` (C213 → C214 → C215)

**Fecha de congelación:** 2026-11-22 21:38 GMT-5 (Ecuador)  
**Orden de JFC:** Impedir abrir más frentes. Delimitar problema, alcance y archivos permitidos por corte para que sea arreglable de forma secuencial (**WIP = 1**).

---

## Regla Madre (WIP = 1 · Cero frentes paralelos)

1. **Un solo corte activo a la vez.** Prohibido empezar el Corte N+1 hasta cumplir el criterio binario `DONE` del Corte N.
2. **Lista blanca cerrada de archivos por corte.** Todo cambio fuera de la lista blanca del corte activo queda **RECHAZADO** automáticamente por `src/verify-scope-lock.cjs`.
3. **Frentes PERMANENTEMENTE CONGELADOS (prohibido tocar):**
   - Reparaciones de Sync3 (`incident-v608`, cold-join Firebase/Supabase, `sync3-silent-cascade.mjs`).
   - Refactorizaciones de CSS / UI / cosmética / interruptores de UI.
   - Scripts de puntajes / métricas (`architecture-2-port-score`, `architecture-2-quality-score`).
   - Nuevas features o ideas fuera de C213–C215.
4. **Secuencia obligatoria ante cualquier fallo dentro del corte activo:**
   `Reproducir (RED) -> Reparar causa raíz mínima -> Debuggear/Verificar (GREEN) -> Sellar -> Publicar -> Comprobar en vivo`.
   Prohibido narrar excusas, proponer otro frente o abrir una rama nueva paralela.

---

## CORTE 1 — C213 (`v0.8.95`, base `17131947`) · PUBLICAR Y DESPLEGAR

- **Problema único definido:** `master`/`estable` siguen en `v0.8.94` (`9fe50b58`) y la rama `feat/c213-sync4-todos-roles-pin-panel` (`17131947`) aún no está publicada ni los Workers desplegados con `team-authority.mjs` (PIN-only), `ws-worker-api.mjs` (grants por defecto) y `ws-authority-client.js` (`cat:read`).
- **Archivos permitidos:** **NINGUNO nuevo** (solo corrección mínima si un check rojo de CI de C213 falla en `test/`).
- **Acciones permitidas (en este orden exacto):**
  1. Verificar checks verdes de `feat/c213-sync4-todos-roles-pin-panel` (`17131947`).
  2. Fusionar a `master`, promover `estable` y confirmar workflow `publicar` SUCCESS en GitHub Pages.
  3. Desplegar `cloudflare-worker` (`friendly123-licencias`) y `cloudflare-yparty-worker` (`friendly123-yparty-port2-canary-qa`).
- **Criterio binario `DONE` (Corte 1):**
  - `GET https://jfcarpiopuntocom.github.io/friendly-123/version.json` responde `v0.8.95`.
  - Ambos Workers desplegados y respondiendo 200.
  - 1 login Dueño + 1 login Empleado en tienda piloto sin error 500/403.

---

## CORTE 2 — C214 (`v0.8.96`) · SOLO CORRECTITUD Y ACTIVACIÓN SYNC4 EN APARATOS NUEVOS/COMPARTIDOS

- **Problema único definido:** En `v0.8.95` (`17131947`) siguen existiendo 4 defectos concretos que impiden activar Sync4 en aparatos nuevos o compartidos:
  1. `admin`/`empleado` en `sala-vacia` nueva falla al no existir todavía las raíces `productos`/`ubicaciones`.
  2. `pausarParaArquitectura20()` devuelve `{ ok: false }` cuando el aparato nunca tuvo sala Sync3 (`!leerSala()`).
  3. `auth-ui.js` omite `/team/verify` para `admin` con hash local, no bloquea `403 team-not-verified` y no borra `window.__f123CentralTeamPrincipal` al cerrar sesión.
  4. Falta `window.OCSync4Diagnostico()` para comprobar `rutaEfectiva` en 1 línea en Safari/Opera.
- **Parches ya construidos y verificados (`patches-v895/`):** `01`, `02`, `03`, `06`.
- **Lista blanca CERRADA de archivos en `friendly-123`:**
  - `src/port2-readonly-catalog-session.mjs`
  - `docs/sync-realtime.js` (+ `docs/sync-realtime.min.js`)
  - `src/yparty-piloto.js` (+ `docs/vendor/yparty-piloto.min.js`)
  - `docs/auth-ui.js` (+ `docs/auth-ui.min.js`)
  - Tests nuevos de regresión en `test/` para C214
  - Sello de versión: `docs/version.json`, `docs/sw.js`, `docs/dashboard.html`, `docs/index.html` (solo versión/meta), `docs/version-manifest.json`
- **PROHIBIDO en Corte 2:** tocar `docs/carga-tardia.js`, `docs/i18n.js`, `docs/sync-rollout.json`, CSS o Sync3.
- **Criterio binario `DONE` (Corte 2):**
  - CI verde + `v0.8.96` publicada en GitHub Pages (`version.json` = `v0.8.96`).
  - Ciclo real **A→B→A × 2** (Dueño + Admin/Empleado) en tienda piloto: `window.OCSync4Diagnostico().rutaEfectiva === "sync4-a-2.0"`, stock y dinero idénticos en ambos aparatos, y `window.__f123CentralTeamPrincipal === null` tras cerrar sesión.

---

## CORTE 3 — C215 (`v0.8.97`) · ENCENDIDO DE TIENDAS CLIENTES + ARRANQUE JS ≤ 40 %

- **Problema único definido:** (A) Habilitar Sync4 en las tiendas clientes autorizadas (lista de licencias + `SALAS_PILOTO` + `docs/sync-rollout.json` con `WS_ABRIR_SIN_HISTORIA=1`); (B) bajar el JS síncrono pre-PIN de `2,522,894 B` (`68.07 %`) a `≤ 1,482,506 B` (`≤ 40.00 %`).
- **Parches ya construidos y verificados (`patches-v895/`):** `04`, `05`.
- **Lista blanca CERRADA de archivos en `friendly-123`:**
  - `docs/index.html`
  - `docs/carga-tardia.js`
  - `docs/i18n.js` (+ `docs/i18n.min.js`)
  - `docs/i18n-es.js` (+ `docs/i18n-es.min.js`)
  - `docs/sw.js`
  - `docs/sync-rollout.json`
  - Tests de regresión de arranque/i18n en `test/`
  - Sello de versión: `docs/version.json`, `docs/dashboard.html`, `docs/version-manifest.json`
- **PROHIBIDO en Corte 3:** tocar `auth-ui.js`, `sync-yjs.js`, `sync-realtime.js`, `yparty-piloto.js` ni lógica de Workers.
- **Criterio binario `DONE` (Corte 3):**
  - Arranque síncrono JS ≤ `1,482,506 B` (`≤ 40 %`), 0 errores en consola en Safari iPhone y Opera Air, cambio EN↔ES instantáneo offline, y tiendas clientes operando en Sync4 sin pérdida de datos.

---

## Verificación automática de Scope Lock (antes de cada commit/PR)

```bash
node projects/sync4-architecture-2-0/src/verify-scope-lock.cjs --cut C214 --repo "C:\00 Projects\claude-f123\friendly-123" --base 17131947 --head HEAD
```

Devuelve **exit code 0** solo si el 100 % de los archivos tocados pertenecen a la lista blanca del corte activo y no tocan ningún frente congelado.
