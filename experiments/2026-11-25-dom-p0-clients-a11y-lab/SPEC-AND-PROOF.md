# Ingeniería 2.0 · Spec + Prueba RED→GREEN (Workshop Lab · Parking Lot Post-STABLE)

**Clasificación Scope Lock (`4231642b-67f3-8108-aaff-cabb65e794a6`):** `PARKING LOT POST-STABLE · SOLO WORKSHOP`.  
**Target base auditado (sin modificar):** `friendly-123` `v0.9.27` (`c3ec60e0b`).  
**Reglas aplicadas:** `spec-driven-development`, `constraint-driven-development`, `planning-and-task-breakdown`, `friendly123-ponytail` (`full`).  
**Datos:** 100 % sintéticos (`1,200` productos, `2,000` ventas, `400` clientes, `400` gastos, `12` perchas, `15` promotoras).

---

## 1. Especificación y Delimitación Negativa (Scope Lock)

### DENTRO DE ALCANCE (solo overlay HTTP en memoria durante la prueba GREEN del workshop)
1. `src/app/app-inline-01.js`:
   - `tarjetaCliente`: montar `#oc-cliedit-${c.id}` de forma perezosa solo cuando `panelEditAbierto === true` (`!panelEditAbierto ? "" : ...`). Verificado que el único consumidor externo (`test/customer-profile-browser.test.js:31`) invoca `toggleEditarContacto('cliedit-' + id)` antes de interactuar con el formulario.
   - `cargarClientes`: pasar `tamanoLote: 40, debounceMs: 150` a `AMG.ListaDinamica.crear()`.
   - `cargarClientes` (`Seasons` L2002 y `neutros` L2040): acotar listado inline a `12` nombres + `+N more` (mismo patrón ya existente en `celdaComp` L2024).
2. `docs/lista-dinamica.js`:
   - Soporte opcional `tamanoLote` (default `0` = sin cambio para llamadores existentes) con botón incremental `[data-lista-ver-mas]` (`Show more (N remaining)` / `Mostrar más (N restantes)`). Búsqueda, ordenamiento y filtro `Pending payment` siguen operando sobre el **100 %** del array en memoria.
   - Soporte opcional `debounceMs` (inmediato al vaciar búsqueda).
3. `src/app/app-inline-07.js`:
   - Pre-indexar `label[for]` en un `Set` una sola vez por corrida (elimina $O(M \times N)$ `document.querySelector('label[for=...]')` por cada input).
   - Limitar las pasadas disparadas por `MutationObserver` a `.vista.activa` y modales visibles (`.modal.visible, [id$='-overlay']`) sin escanear pestañas ocultas.

### FUERA DE ALCANCE (`OUT OF SCOPE` — estrictamente prohibido en este slice)
- Cero cambios en `friendly-123` `master`/`estable` ni en archivos de `PR #1110` (`docs/sync-yjs.js`, `docs/mock-backend.js`, `docs/hechos.js`).
- Cero cambios visuales, de colores, CSS, tipografías, botones o copy existente.
- Cero cambios en cálculo de saldos (`pintarSaldoCartera`), filtro `Pending payment`, persistencia IDB o formato de datos de clientes.
- No toca `Vender`, `Inventario`, `Etiquetas`, `Gastos`, `Sold` ni `dashboard.html` (van en slices separados si JFC los autoriza post-STABLE).

---

## 2. Resultados REALES RED → GREEN (`results-red-green.json`)

Ejecutado serialmente en WebKit iPad (`1024×768`), WebKit iPhone (`390×844`) y Chromium Tablet (`1024×768` + CDP), `pageErrors: []` en los 6 recorridos:

| Métrica (`400` clientes, `1,200` productos, `2,000` ventas) | RED (`v0.9.27`) | GREEN (Ponytail Lab) | Delta real |
|---|---:|---:|---:|
| `#vista-clientes` elementos DOM | `46,993` | **`2,723`** | **-94.2 %** |
| `<option>` ocultos en `#listaClientes` | `15,600` | **`0`** | **-100 %** |
| DOM total acumulado tras 5 pestañas | `52,904` | **`8,634`** | **-83.7 %** |
| Chromium CDP `JSEventListeners` (`clientes` / pico) | `7,611` / `10,027` | **`1,214`** / **`2,124`** | **-84.0 %** / **-78.8 %** |
| WebKit iPad `clientes` switch | `11,692 ms` | **`2,757 ms`** | **4.2× más rápido** |
| WebKit iPad `gastos` (tras `clientes`) | `3,834 ms` | **`1,199 ms`** | **3.2× más rápido** |
| WebKit iPad `perchas` (tras `clientes`) | `5,324 ms` | **`1,144 ms`** | **4.7× más rápido** |
| WebKit iPad `comisiones` (tras `clientes`) | `2,525 ms` | **`862 ms`** | **2.9× más rápido** |
| WebKit iPhone `clientes` switch | `14,576 ms` | **`2,687 ms`** | **5.4× más rápido** |
| WebKit iPhone `perchas` (tras `clientes`) | `3,703 ms` | **`1,001 ms`** | **3.7× más rápido** |
| WebKit iPhone `comisiones` (tras `clientes`) | `3,097 ms` | **`781 ms`** | **4.0× más rápido** |
| Chromium Tablet `clientes` switch | `12,388 ms` | **`1,771 ms`** | **7.0× más rápido** |
| Chromium Tablet `gastos` (tras `clientes`) | `2,528 ms` | **`464 ms`** | **5.4× más rápido** |
| Chromium Tablet `perchas` (tras `clientes`) | `3,604 ms` | **`689 ms`** | **5.2× más rápido** |

---

## 3. Verificación funcional E2E en navegador real (`18/18 PASS` — `6/6` × 3 motores)

Comprobado en WebKit iPad, WebKit iPhone y Chromium Tablet sobre GREEN:
1. `initialBatch40`: monta exactamente `40` tarjetas iniciales y muestra `360 remaining`.
2. `zeroHiddenOptions`: `0` nodos `<option>` ocultos en DOM al abrir `Customers`.
3. `showMore40To80`: pulsar `[data-lista-ver-mas]` agrega tarjetas `41..80` de forma incremental sin destruir las primeras 40.
4. `globalSearchCustomer399`: buscar `"Customer 399"` (fuera del lote inicial) encuentra y pinta `Synthetic Customer 399` (1 resultado exacto).
5. `lazyEditMount29Countries`: pulsar `✎ Edit contact / notes` monta `#oc-cliedit-*` visible (`display:flex`) con las `29` opciones intactas de `OC_PAISES`.
6. `saveNoteRoundtrip`: guardar una nota editada persiste y se refleja tras el repintado de `cargarClientes()`.

---

## 4. Reproducción y puerta de promoción

```powershell
$env:NODE_PATH = "C:/00 Projects/claude-f123/wt-peso/node_modules;C:/00 Projects/friendly-123-piloto-lab/cloudflare-yparty-worker/node_modules"
$env:PLAYWRIGHT_BROWSERS_PATH = "C:/Users/JFC/AppData/Local/ms-playwright"
node experiments/2026-11-25-dom-p0-clients-a11y-lab/run-clients-a11y-red-green.cjs
```

- **Promoción a `friendly-123`:** **BLOQUEADA hasta luz verde literal de JFC** después de cerrar la Cola Finita STABLE (`PR #1110` + prueba física PC ↔ iPhone).
- **Límite honesto:** no mide RAM privada Jetsam en iPhone físico ni incluye fotos reales `<img>`.
