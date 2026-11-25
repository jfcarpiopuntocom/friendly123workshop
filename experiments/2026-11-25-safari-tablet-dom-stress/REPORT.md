# Auditoría Profunda + Stress Test WebKit iPad/iPhone & Chromium CDP — `friendly-123` `v0.9.27` (`c3ec60e0b`)

**Fecha:** 2026-11-25  
**Target auditado (solo lectura, cero ediciones a producción):** `friendly-123` `origin/master` = `origin/estable` = `c3ec60e0b` (`v0.9.27`, shell `f123-shell-v927`, `golden465`).  
**Datos:** 100 % sintéticos (`1,200` productos, `2,000` ventas, `400` clientes, `400` gastos, `12` perchas, `15` promotoras). Cero datos de clientes, cero tráfico externo.  
**Reglas vigentes respetadas:** Ponytail `full`, Scope Lock & «TERMINAR TERMINAR» (23:36 GMT-5 del 2026-11-24): **cero cambios visuales/CSS/botones**, **cero commits en `friendly-123` `master`/`estable`**, todo en laboratorio reproducible de `friendly123workshop`.

---

## 1. Foto exacta de repositorios y coordinación (2026-11-25 02:00 GMT-5)

| Repo / Rama | Commit / Estado | Hallazgos verificados |
|---|---|---|
| `friendly-123` `origin/master` & `origin/estable` | `c3ec60e0b` (`v0.9.27`, PR `#1109`) | En producción. Incluye batching de 60 tarjetas en Commissions (`#listaComisiones` bajó a **714 nodos** con 2,000 ventas) y timeout/backoff en `hechos.js`. |
| `friendly-123` `origin/codex/c246-recovery-v927-20261125` | `e07fb9978` (`v0.9.28` candidato) + `dfb5a058c` | Rebase limpio de C246 sobre `v0.9.27`: `aplicarCatalogoParcialSeguro`, stripping de `nombreNegocio`/`pinsRol` en recuperación parcial, bloqueo por `[licencia, f123_tienda_activa]` y backoff exponencial con guarda `document.hidden`. **OJO bloqueante antes de merge:** el commit `dfb5a058c` tiene `Author: Codex <codex@users.noreply.github.com>` — debe enmendarse al autor de JFC (regla dura: cero huellas de IA en commits). |
| `friendly123workshop` `coord/c246-recovery-20261125` | `83be6fbfc` | Incluye `c246-source.patch`, `README.md` y **`hechos-v927-raw-marker-red.test.cjs`**, que reproduce un riesgo P0 independiente en `docs/hechos.js` de `v0.9.27`: si `indexedDB.databases()` se cuelga o devuelve `amg_hechos_db` raw mientras la base prefijada `f123::amg_hechos_db` está vacía, el marcador `f123_hechos_migrado_v1` puede sellarse prematuramente dejando el historial vacío sin resolver propiedad legacy. |
| `friendly123workshop` `lab/p0-perf-gate-v926-20261124` | `599134ee9` | Contiene `scope-check.cjs` (guardrail determinista de rutas aprobadas) y pruebas RED/GREEN en DOM nativo para `gridVender` stale request y panel de traslados (`native_mount.py`, `native_selector.py`, `mount-race.cjs`). |
| `friendly123workshop` `lab/r10-reconcile-stale-candidates-20261124` | `6d394b719` | Parches secuenciales `R10b + R11 + R12` (validados sobre `v0.9.25` con WebKit nativo); pendientes de rebase/verificación sobre `v0.9.27`/`v0.9.28`. |
| `friendly123workshop` `lab/ponytail-sync4-r5-20261123` | `ae483c408` | Candidato `R8b` (`legacyOpId` preservando contrato C36) en laboratorio. |
| **Notion MCP** | `Unauthorized: rejected by transport` (01:23–01:44 GMT-5) | El servidor MCP `notion_notion` rechazó las llamadas por token/sesión caducada. No se fingió escritura en Notion; la sección 7 de este reporte deja el apunte listo para pegar/sincronizar en cuanto se reconecte Notion en Plugins Manager. |

---

## 2. Resultados REALES del Stress Test (`results.json` — cero números estimados)

Ejecutado serialmente (un motor a la vez, cero errores de página `pageErrors: []`) contra `wt-v927-stress/docs` (`c3ec60e0b`) servido en `127.0.0.1`:
- **Dataset sintético:** `1,200` productos (`ubicacionActual = "todas"` al recargar, vista real del dueño), `2,000` ventas (3 meses + hoy), `400` clientes, `400` gastos, `12` perchas, `15` promotoras. **Sin fotos `<img>`** (con fotos reales, la RAM de decodificación WebKit se suma encima).

### 2.1 Navegación secuencial por pestañas (`docs/index.html`)

| Pestaña (`data-vista`) | WebKit iPad (`1024×768`) | WebKit iPhone (`390×844`) | Chromium Tablet (`1024×768`) | DOM total (elementos) | Activos en pestaña | **Zombis ocultos (`display:none`)** | CDP Nodes (Chromium) | CDP `JSEventListeners` | CDP Heap usado |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `hoy` (Today) | 806 ms | 621 ms | 541 ms | 1,359 | 214 | 719 | 8,050 | 761 | 38.98 MB |
| `escanear` (Sell `#gridVender`) | **2,756 ms** | **3,083 ms** | 2,023 ms | 9,015 | 7,714 | 847 | 26,885 | 370 | 24.07 MB |
| `inventario` (`#gridInventario`) | **1,940 ms** | **2,224 ms** | 1,411 ms | 22,246 | 13,331 | 8,461 | 68,953 | **5,168** | 19.41 MB |
| `etiquetas` (`#gridEtiquetas`) | 1,473 ms | 1,852 ms | 825 ms | 27,046 | 4,811 | 21,781 | 83,362 | **6,373** | 45.04 MB |
| `comisiones` (`#listaComisiones`, v0.9.27) | 1,366 ms | 1,520 ms | 874 ms | 28,057 | **1,026** | **26,577 (94.7 %)** | 85,516 | 6,429 | 41.22 MB |
| **`clientes` (`#listaClientes`)** | **25,096 ms** | **31,722 ms** | **13,141 ms** | **75,014** | **46,993** | 27,567 | **264,440** | **15,245** | 45.64 MB |
| `gastos` (`#listaGastos`) | **5,613 ms** | **5,198 ms** | 3,015 ms | 78,263 | 3,296 | **74,513 (95.2 %)** | 270,999 | 14,433 | 46.06 MB |
| `perchas` (`#vista-perchas`) | **4,023 ms** | **3,425 ms** | 2,319 ms | **78,365** | **115** | **77,795 (99.3 %)** | **271,334** | **14,473** | **48.07 MB** |

### 2.2 Anatomía exacta del DOM retenido (medido en vivo en los 3 motores)

- `#gridVender`: `1,200` tiles (`7,200` elementos) — **sí** usa delegación de eventos (`370` listeners), pero monta el 100 % sin batching ni guard de última petición.
- `#gridInventario`: `1,201` hijos (`13,226` elementos), **`2,400` botones `+/-` con `addEventListener` individual** (más `1,200` de edición cuando `puedeGestionar()` activa los botones directos), disparando los listeners de `370` → `5,168` (+4,798) en un solo toque.
- `#gridEtiquetas`: `1,200` tarjetas (`4,800` elementos) con `onclick` inline por tarjeta.
- `#listaComisiones`: **`714` elementos** (prueba directa de que el batching de `v0.9.27` funciona excelente).
- **`#listaClientes` (400 clientes):** **`46,890` elementos** (`~117` nodos por tarjeta!), compuesto por:
  - **`15,600` nodos `<option>` ocultos** dentro de `400` paneles `#oc-cliedit-*` en `display: none` (3 `<select>` por tarjeta: edad 8 + `OC_PAISES` 29 + género 3 = 39–40 `<option>` × 400).
  - **`4,400` nodos `<svg>`** (11 SVGs inline por tarjeta × 400).
  - **`445,507` caracteres** de texto en `#listaClientes`.
  - **`400` lecturas concurrentes `pintarSaldoCartera(c.id)` -> `fetch('/api/clientes/:id/cartera')`** en `alPintar`, disparadas al abrir Y en cada tecla de búsqueda (sin debounce).

### 2.3 Ciclo de estrés de 15 cambios rápidos de pestaña (3 × `[inventario, escanear, etiquetas, gastos, comisiones]` tras haber visitado `clientes` una vez)

| Perfil | Promedio por cambio | Peor cambio | DOM inicio → fin | Heap post-GC inicio → fin (CDP) | Layouts / RecalcStyles (CDP) |
|---|---:|---|---:|---:|---:|
| WebKit iPad (`1024×768`) | **3,754 ms** | `5,983 ms` (`escanear`, ciclo 2) | `78,365 → 78,365` | — | — |
| WebKit iPhone (`390×844`) | **4,467 ms** | **`7,938 ms`** (`escanear`, ciclo 3) | `78,365 → 78,365` | — | — |
| Chromium Tablet (`1024×768`) | **1,934 ms** | `3,776 ms` (`escanear`, ciclo 2) | `78,365 → 78,365` | `16.96 MB → 20.62 MB` (+3.66 MB retenidos tras GC) | `39 → 91` / `74 → 138` |

> **Prueba del efecto veneno compuesto:** antes de abrir `Customers`, entrar a `Commissions` tomaba `1,366 ms` en WebKit iPad (`1,520 ms` en iPhone). Después de abrir `Customers` UNA vez (dejando `46,993` nodos y `~3,200` inputs/selects ocultos en `#vista-clientes`), entrar a la MISMA pestaña `Commissions` subió a `3,420–3,682 ms` en iPad (`3,591–4,724 ms` en iPhone), y `Shelves` (con solo 115 elementos!) pasó a `4,023 ms` en iPad.

### 2.4 Estrés de `MutationObserver` en `docs/dashboard.html` (`dashboard-main.js:4412`)

| Perfil | `MutationObserver` activos en `body` | Ráfaga tabla 1,000 filas (6,000 celdas) | `TreeWalker` invocaciones / nodos de texto recorridos | 10 latidos `pintarMicelio` (15 dispositivos c/u) | `TreeWalker` + `querySelectorAll` acumulados tras 10 latidos |
|---|---:|---:|---:|---:|---:|
| WebKit iPad (`1024×768`) | 1 | **502.0 ms** | `2` / **`12,000`** nodos | **213.0 ms** | **`153`** `TreeWalker` + **`153`** `querySelectorAll` |
| Chromium Tablet (`1024×768`) | 1 | **468.4 ms** | `2` / **`12,000`** nodos | 100.2 ms | **`153`** `TreeWalker` + **`153`** `querySelectorAll` |

---

## 3. Ranking de Bombas de Tiempo DOM / Safari (por impacto real medido)

### P0-1 · `#vista-clientes`: `tarjetaCliente` + `ListaDinamica` sin paginación ni debounce (`31.7 s` iPhone / `25.1 s` iPad / `46,993` nodos)
- **Ubicación exacta:** `src/app/app-inline-01.js:1270-1369`, `1945-2040`; `docs/lista-dinamica.js:266-298`.
- **Causa raíz triple:**
  1. Cada tarjeta de cliente pre-monta su formulario de edición colapsado (`display:none`) con 3 `<select>` completos (`OC_RANGOS_EDAD` + `OC_PAISES` + género = 39–40 `<option>` × N clientes = `15,600` `<option>` ocultos con 400 clientes).
  2. `ListaDinamica` solo aplica `limite` cuando `restringido === true` (empleado); para dueño/admin monta el 100 % de clientes y dispara `alPintar` -> `N` `pintarSaldoCartera(c.id)` concurrentes en cada apertura Y en cada tecla (`input` sin debounce).
  3. `ESTACIONES` (`L2002`) y `neutros` (`L2040`) imprimen el 100 % de nombres sin `.slice()` (a diferencia de `celdaComp` en `L2024`, que ya corta a 6).
- **Desactivación Ponytail (0 cambios visuales):**
  1. Montar el contenido de `#oc-cliedit-${c.id}` de forma perezosa dentro de `toggleEditarContacto(key)` al tocar `✎ Edit contact / notes` (elimina ~70 nodos/cliente al instante).
  2. Batching de 40–50 clientes iniciales en `ListaDinamica` (mismo patrón `"Show more"` ya validado en `v0.9.27` Commissions; la búsqueda y los filtros siguen operando sobre el 100 % del array en memoria) + debounce de `150 ms` en el buscador + concurrencia acotada (p. ej. 6 en paralelo) en `pintarSaldoCartera`.
  3. Cap visual coherente (`slice(0, 12)` + `+N más`) en `Seasons` (`L2002`) y `neutros` (`L2040`).

### P0-2 · Veneno global $O(N^2)$ en `src/app/app-inline-07.js:8-24` + Retención de pestañas ocultas (`77,795` nodos zombi = `99.3 %`)
- **Ubicación exacta:** `src/app/app-inline-07.js:8-24` y selector de vistas en `src/app/app-inline-01.js`.
- **Causa raíz doble:**
  1. `app-inline-07.js:23` instala `new MutationObserver(pronto).observe(document.documentElement, { childList: true, subtree: true })` y en cada mutación de cualquier parte de la app ejecuta `etiquetar(document)` sobre **todo el documento**; por cada `input`/`select`/`textarea` sin `aria-label`, corre `document.querySelector('label[for="' + el.id + '"]')` sobre todos los `78,365` nodos.
  2. Al cambiar de pestaña, ninguna vista pesada libera su grilla DOM; todas quedan residentes tras `display: none`. Encima, `setInterval(actualizarFAB, 3000)` (`app-inline-06.js:110`) y `setInterval(_pintarSyncMin, 3000)` (`avanzado-extra.js:988`) corren cada 3 s incluso con `document.hidden === true`.
- **Desactivación Ponytail (0 cambios visuales):**
  1. En `app-inline-07.js`: pasar únicamente los nodos añadidos (`addedNodes`) a `etiquetar(nodo)` — o como mínimo limitar a la `.vista.activa` + pre-indexar un `Set` de todos los `label[for]` una sola vez por corrida en lugar de $O(M \times N)$ `document.querySelector`.
  2. Teardown limpio de grillas de pestañas inactivas al salir de vistas masivas (`#gridVender`, `#gridInventario`, `#gridEtiquetas`, `#listaClientes`, `#listaGastos`), conservando estado de búsqueda/filtro/scroll en variables JS (como ya hace `_estadoListaClientes`!). Esto baja los nodos residentes de **`78,365` → `< 2,500`** independientemente de cuántas pestañas visite el usuario en un turno de 10 horas en iPad.
  3. Añadir guarda `if (document.hidden) return;` en los `setInterval` de UI (`app-inline-06.js:110`, `avanzado-extra.js:802,988`, `dashboard-main.js:152,2379`).

### P0-3 · `#gridInventario` (`13,226` nodos + `+4,798` listeners por carga) y `#gridVender` (`7,200` nodos, hasta `7.9 s` en iPhone) y `#gridEtiquetas` (`4,800` nodos)
- **Ubicación exacta:** `src/app/app-inline-01.js:276-305` (`cargarGridVender`), `3280-3388` (`cargarInventario`), `5854-5879` (`cargarEtiquetas`).
- **Causa raíz:** Las tres pantallas montan el 100 % de los productos síncronamente sin paginación/batching; `#gridInventario` además ata listeners individuales en `L3357` y `L3374` (en lugar de usar delegación como ya hace en `L3364` para `[data-variante]` y en `L305` para `#gridVender`), y `cargarGridVender` / `cargarEtiquetas` carecen de guarda de última petición (`_rev`).
- **Desactivación Ponytail (0 cambios visuales):**
  1. Unificar `[data-editar-directo]`, `[data-ajuste-menos]`, `[data-ajuste-mas]` y `[data-estrella-toggle]` en el listener delegado único de `#gridInventario` (elimina ~3,600–4,800 listeners de golpe).
  2. Aplicar el mismo patrón de batching incremental de `v0.9.27` (60–80 tarjetas iniciales + `"Show more"` / carga al acercarse al final, con búsqueda y filtro sobre el catálogo completo) a `#gridVender`, `#gridInventario` y `#gridEtiquetas`, más revision guard contra respuestas tardías.

### P1-4 · `docs/dashboard.html` — `MutationObserver` global en `document.body` (`502 ms` / `12,000` nodos por tabla)
- **Ubicación exacta:** `src/dashboard/dashboard-main.js:4391-4421` y `146-174`, `2379`.
- **Causa raíz:** Cada inserción DOM en `dashboard.html` dispara un `MutationObserver` en `document.body` (`childList + subtree + characterData + attributes`) que ejecuta `querySelectorAll("[placeholder],[title],[aria-label]")` + `TreeWalker(SHOW_TEXT)` síncrono sobre cada nodo añadido (2 pasadas = `12,000` nodos en una tabla de 1,000 filas; `153` pasadas en 10 heartbeats). Además `pulso()` reescribe `textContent` cada 5 s aunque el texto no haya cambiado.
- **Desactivación Ponytail (0 cambios visuales):**
  1. Cuando `LANG === "en"` (idioma base del HTML) o si el nodo está dentro de contenedores de datos tabulares (`table tbody`, `.tabulator-table`, `#micelio-lista` con marca `data-no-i18n-walk`), omitir el recorrido completo de celdas de datos (traducir encabezados/chrome explícitamente).
  2. Desconectar temporalmente el observer durante la traducción propia (`obs.disconnect()` -> traducir -> `obs.observe(...)`) para cortar la doble pasada medida (`TreeWalker calls = 2` -> `1`), y en `pulso()` escribir solo si `el.textContent !== txt`.

### P1-5 · `docs/avanzado-extra.js` — `URL.revokeObjectURL` síncrono en export de respaldo iOS Safari + 2 observers sin `.disconnect()`
- **Ubicación exacta:** `docs/avanzado-extra.js:3009-3012` (CSV contable), `3110-3113` (respaldo JSON verificado del dueño!), `2686`/`2756` (observers de `rNav`), `802` (`setInterval` sin singleton).
- **Causa raíz:** Revocar el Object URL en la línea inmediatamente posterior a `a.click()` compite con el handoff asíncrono de descarga de WebKit iOS/iPadOS (puede bajar archivo vacío o fallar silenciosamente). `backup-scheduler.js:174` ya aplica el patrón correcto (`setTimeout(..., 5000)`).
- **Desactivación Ponytail:** Reemplazar `URL.revokeObjectURL(a.href)` por `setTimeout(() => URL.revokeObjectURL(url), 5000)` en L3012 y L3113, y agregar guarda singleton/visibility en L802.

### P2-6 · `#listaGastos` sin batching ni revision guard (`3,200` nodos para 400 gastos)
- **Ubicación exacta:** `src/app/app-inline-01.js:6327-6486`.
- **Desactivación Ponytail:** Batching de 60 gastos iniciales + revisión de última petición + delegación de `.oc-gasto-chip` (L6454).

---

## 4. Investigación Online: Arquitectura de Web Apps y PWAs Maduras (Safari / iPadOS / Tablet-First POS)

Síntesis de documentación y hallazgos de ingeniería de PWAs offline-first maduras en WebKit/Safari iOS/iPadOS (Linear, Excalidraw, POS web en iPad, WebKit/web.dev/Nolan Lawson):

1. **Techo real de Jetsam en Safari iOS/iPadOS:**
   - WebKit aplica límites estrictos por proceso de pestaña (~300–450 MB en iPhones/iPads gama media; ~1 GB en Pro) y mata/recarga pestañas sin aviso si combinan árboles DOM masivos + capas de composición + bitmaps `<img>`/`<canvas>` + heap JS.
   - **Regla de oro de presupuesto DOM en POS tablet-first:** mantener `< 2,000–3,000` nodos activos en pantalla y **desmontar pestañas ocultas** (`< 500` nodos retenidos fuera de vista). Hoy `friendly-123` llega a `78,365` elementos (`271,334` nodos internos en Blink) con solo 1,200 productos y 400 clientes.
2. **Por qué `content-visibility: auto` NO basta por sí solo en Safari 18+:**
   - En WebKit/Safari 18+, `content-visibility: auto` exige `contain-intrinsic-size: auto <altura>px` para evitar saltos bruscos de la barra de scroll, **y además Safari omite subárboles saltados en Cmd+F / Buscar en página**.
   - Para catálogos POS de 1,000–10,000 filas, el estándar maduro es **batching acotado / virtualización real en JS (≤ 60–100 tarjetas montadas)** con búsqueda/filtro en memoria sobre el 100 % de los datos + teardown al cambiar de pestaña. `content-visibility: auto` solo sirve como refuerzo secundario en listas medianas, nunca como sustituto.
3. **Almacenamiento IndexedDB en WebKit (`Structured Clone` en el hilo principal):**
   - WebKit ejecuta el *Structured Clone Algorithm* de IndexedDB de forma **síncrona en el hilo principal**. Guardar un único objeto monolítico de varios MB dispara tareas largas (>50–300 ms) y amplificación de escritura en cada venta.
   - **Estado en `friendly-123` (`docs/estado-idb.js`):** excelente avance previo (`v837`) partiendo `movimientos` y `actividadCompartida` en bloques de 500 / 64 cubetas hash. **Deuda futura (fuera del Scope Lock actual):** `productos`, `ventas`, `clientes` y `gastos` siguen inline dentro de la clave única `"actual"`, y las cubetas sin cambio ejecutan `JSON.stringify(r.result) !== JSON.stringify(bloqueEsperado)` en cada guardado. En una etapa post-estabilización, migrar esas colecciones a objectStores normalizados por ID o dirty-key tracking eliminará el impuesto de clonado en Safari.
4. **Teclado virtual y viewport en iPadOS Safari (`VisualViewport` vs `100dvh`/`100svh`):**
   - `100svh` / `100dvh` (ya usado en `dashboard-main.css:84`) gestionan la barra de direcciones, **NO el teclado virtual** de iPadOS/iOS. Cuando el cajero enfoca un buscador o modal con teclado en pantalla, solo `window.visualViewport` (`resize` + `scroll` -> `--app-height`, `--app-top`) evita que inputs inferiores o barras fijas salten o queden tapados.
   - `touch-action: manipulation` (ya presente en `app-style-02.css:237` y botones de `gridVender`) elimina el retraso de 300 ms y el doble-tap zoom indeseado en controles POS; debe aplicarse a controles interactivos sin bloquear el pan natural de contenedores scrolleables.
5. **Supervivencia de PWA en iPad/iPhone (ITP + ciclo de vida `visibilitychange`):**
   - Instalar en Pantalla de Inicio (`display: standalone`) + solicitar `navigator.storage.persist()` protege contra la purga ITP de 7 días de Safari.
   - Al dispararse `document.hidden === true`, una PWA madura pausa timers/animaciones, vacía cachés temporales de DOM/canvas (`canvas.width = canvas.height = 1` al desmontar) y asume que iPadOS puede matar el proceso en cualquier segundo (persistencia inmediata en IDB, cero estado crítico solo en RAM).
   - **Detalle tablet-first encontrado en `docs/manifest.json:7`:** actualmente declara `"orientation": "portrait-primary"`, que orienta hacia vertical en tablets Android/Chromium; en POS tablet-first en soporte horizontal conviene `"orientation": "any"` (post-Scope Lock).
   - **Seguridad Dashboard (`docs/dashboard.html`):** a diferencia de `docs/index.html` (que incorporó CSP en `v0.9.25` PR `#1107`), `docs/dashboard.html` aún no declara `<meta http-equiv="Content-Security-Policy">` (post-Scope Lock).
6. **Puertas CI de estrés en WebKit + Chromium CDP:**
   - Chromium CDP (`Performance.getMetrics`: `JSHeapUsedSize`, `Nodes`, `JSEventListeners`) cuantifica fugas exactas post-GC; WebKit Playwright valida tiempos reales de WebCore/JavaScriptCore y presupuestos de nodos DOM (p. ej. techo duro `< 5,000` nodos DOM en cualquier pestaña con 1,200 productos + 400 clientes). Este mismo script (`run-dom-stress.cjs`) sirve ya como base reproducible del gate de regresión.

---

## 5. Qué queda explícitamente FUERA DE ALCANCE (Scope Lock JFC 23:36)

Respetando la directiva permanente de JFC:
- **NO** cambiar estética, colores, tipografías, botones ni copy de la app.
- **NO** reescribir `estado-idb.js` ni el modelo de datos/sync durante el cierre de P0.
- **NO** tocar `manifest.json` (`orientation`) ni añadir CSP a `dashboard.html` ni rediseñar layout con `VisualViewport` hasta que JFC levante el Scope Lock.
- **NO** mezclar múltiples fixes en un solo PR: cada bomba DOM (si JFC aprueba desactivarla) entra en slice Ponytail independiente con RED -> GREEN medido por `run-dom-stress.cjs`.

---

## 6. Cómo reproducir este benchmark localmente

```powershell
$env:NODE_PATH = "C:/00 Projects/claude-f123/wt-peso/node_modules;C:/00 Projects/friendly-123-piloto-lab/cloudflare-yparty-worker/node_modules"
$env:PLAYWRIGHT_BROWSERS_PATH = "C:/Users/JFC/AppData/Local/ms-playwright"
node experiments/2026-11-25-safari-tablet-dom-stress/run-dom-stress.cjs
```

Artefactos en esta misma carpeta:
- `run-dom-stress.cjs` — harness reproducible (WebKit iPad, WebKit iPhone, Chromium Tablet CDP + Dashboard `MutationObserver`).
- `results.json` — mediciones crudas exactas sobre `v0.9.27` (`c3ec60e0b`).
- `REPORT.md` — este informe.

---

## 7. Apunte listo para Notion (War Room / DIARIO P0 / Buzón Codex-Claude)

> *(Nota técnica: al 2026-11-25 01:44 GMT-5 el conector MCP `notion_notion` devolvió `Unauthorized: rejected by transport`, por lo que este apunte se preserva versionado en `friendly123workshop` rama `lab/safari-tablet-dom-stress-20261125` para sincronizarlo en cuanto se reconecte Notion.)*

```markdown
### [2026-11-25 · Antigravity] Stress test real WebKit iPad/iPhone + Chromium CDP sobre `v0.9.27` (`c3ec60e0b`)
- **Rama workshop:** `friendly123workshop` -> `lab/safari-tablet-dom-stress-20261125` (`experiments/2026-11-25-safari-tablet-dom-stress/{run-dom-stress.cjs,results.json,REPORT.md}`). Cero cambios a `friendly-123` `master`/`estable`, 100 % datos sintéticos (`1,200` productos, `2,000` ventas, `400` clientes, `400` gastos).
- **Validación de `v0.9.27`:** `Commissions` (`#listaComisiones`) bajó a **714 nodos** (batching confirmado).
- **Bomba nuclear #1 descubierta — `Customers` (`#vista-clientes`):** con solo 400 clientes tomó **31.7 s en WebKit iPhone**, **25.1 s en WebKit iPad** y **13.1 s en Chromium**, explotando a **46,993 elementos** (`15,600` `<option>` ocultos en 400 formularios `#oc-cliedit-*` pre-montados + `4,400` `<svg>` + 400 `pintarSaldoCartera()` concurrentes sin debounce).
- **Bomba #2 compuesta — `app-inline-07.js:23` + retención de pestañas ocultas (`77,795` nodos zombi = 99.3 %):** tras abrir `Customers` una vez, el DOM total queda fijo en **78,365 elementos (`271,334` nodos CDP / `14,473` listeners)** y `app-inline-07.js` escanea `document.querySelector('label[for=...]')` por cada input en cada mutación, ralentizando TODAS las demás pestañas 2.5×–3× (`Shelves` con 115 nodos sube a `4.0 s` en iPad; `Sell` llega a `7.9 s` en iPhone).
- **Bomba #3 — `Inventory` (`13,226` nodos, `+4,798` listeners por carga), `Sell` (`7,200` nodos), `Labels` (`4,800` nodos), `Expenses` (`3,200` nodos):** sin batching; `Inventory` ata listeners por botón en vez de delegar.
- **Bomba #4 — `dashboard.html` (`dashboard-main.js:4412`):** `MutationObserver` en `document.body` recorrió **12,000 nodos de texto** en `502 ms` (WebKit iPad) en una tabla de 1,000 filas y **153 pasadas** en 10 heartbeats `pintarMicelio`.
- **Bomba #5 — `avanzado-extra.js:3012,3113`:** `URL.revokeObjectURL` síncrono justo tras `a.click()` en el export de respaldo JSON y CSV (riesgo de descarga truncada en iOS Safari PWA).
- **Nota de coordinación para Codex (`origin/codex/c246-recovery-v927-20261125`):** el parche `dfb5a058c` se ve limpio y bien acotado sobre `v0.9.27`, pero tiene `Author: Codex <codex@users.noreply.github.com>` — enmendar autor a JFC antes de mergear (cero huellas de IA). También queda abierto el RED sintético `hechos-v927-raw-marker-red.test.cjs` de `coord/c246-recovery-20261125`.
```
