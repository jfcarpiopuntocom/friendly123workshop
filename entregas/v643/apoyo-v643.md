# Apoyo comprobable para sellar v643

**CONFIRMADO · 2 nov 2026.** Inspeccioné y probé el candidato `v643-borde`, SHA `11269a796308a7e364eb5cebfb6dcaa0e6307e3e`. Apareció durante la investigación; repetí el control completo sobre una copia congelada de ese SHA. `master` y `estable` observados: `435239f9bde2c2979afb6515bd1ba2ce899c929b`, integración de v642. Eso acredita Git, no publicación ni adopción.

Preparé **cuatro mecanismos**, sin añadir un proveedor al producto ni aplicar cambios de runtime. Todo el código nuevo, prototipos y evidencia quedó fuera del repositorio de trabajo. Ninguna credencial o sala real utilizada. `git diff --exit-code` terminó con 0; el directorio `data/` preexistente se conservó sin tocar.

La política del entorno sigue `restricted/enforced`, revisión 1: no habilita los hosts de producción ni api.github.com; no expone conectores de Notion/Sentry. No simulé acceso a ellos. La investigación pública sí pudo usar repositorios oficiales, npm y jsDelivr.

## 1. QA que se comprueba a sí mismo y observación sin datos sensibles

**Estado: PROBADO AISLADAMENTE. Uso inmediato en herramientas de Claude.**

**Problema.** Un resumen construido desde los pasos que alcanzaron a ejecutarse puede ocultar los que faltan. Además, depurar guardando URLs completas, cuerpos o excepciones puede copiar PIN, licencias y contenido del cuaderno. Una nueva plataforma de telemetría no arregla ninguno de esos dos problemas por sí sola.

**Código:** `tools/evidence.cjs` y `run.cjs`. Capturar el manifiesto antes del primer await es esencial:

```js
const plan = steps.map(({id, run}) => Object.freeze({id, run}));
const results = plan.map(s => ({id: s.id, state: 'NOT_RUN'}));
for (let i = 0; i < plan.length; i++) {
  try { await plan[i].run(); results[i].state = 'PASS'; }
  catch (_) { results[i].state = 'FAIL'; break; }
}
const ok = results.every(r => r.state === 'PASS');
// El informe usa plan.length como denominador. La CLI devuelve 1 si !ok.
```

La revisión independiente encontró un defecto en mi primera versión: un callback que modificaba el array original reducía `expected`. Conservé el RED (`evidence/mutable-plan-red.log`); el snapshot de IDs/funciones lo corrigió y la regresión pasó. No es una corrección aplicada al arnés Windows de Claude, que no está disponible aquí.

La observación es pasiva y se instala desde Playwright, no desde la app:

```js
const audit = observeMetadata(page, {
  origins: {[new URL(page.url()).origin]: 'local'}, limit: 128
});
// Solo tipo de evento, etiqueta de proveedor, método, tipo de recurso y status.
// Sin URL, consulta, cabeceras, body, mensaje de error, PIN ni identidad.
// ... ejecutar aserciones sintéticas ...
const metadata = audit.snapshot();
audit.close(); // retira los listeners
```

**Prueba.** Fallo deliberado: expected=3, executed=2, passed=1, failed=1, NOT_RUN=1, exit 1. Corrida completa: exit 0. Un sink roto lanza una excepción durante un fetch real del navegador y el fetch sigue devolviendo 200; después pasan las comprobaciones de IDB y controlador. Se verifica capacidad de memoria, ausencia de secretos sintéticos y retirada de listeners.

**Si falla / interacción / retirada.** No escribe estado del producto ni reintenta peticiones; la excepción del sink queda contada. La retención del observador está limitada a 1–1024 eventos. Un sink personalizado debe limitar su propio almacenamiento y tiempo. `runPlan` aislado no impone deadlines: el lanzador limita cada subproceso a 45 s y 1 MiB de salida y detiene los pasos siguientes si falla. Ese timeout solicita terminar el proceso; no es garantía de matar un hijo que ignore la señal. Retirada: `close()` y eliminar las herramientas; no hay migraciones ni colas de clientes que deshacer. Cero tráfico de telemetría añadido.

## 2. Auditar CDNs existentes y comprobar los bytes servidos

**Estado: PROBADO AISLADAMENTE. Uso inmediato como auditoría; integración de CDN/SRI en el producto pendiente.**

**Problema y ubicación.** `scripts/gen-manifest.js:47–52` descubre recursos locales `./`; `test/p0-v637-manifest.test.cjs` comprueba los bytes locales enumerados. Eso no detecta cambios de URL, versión o SRI en un CDN externo. En el candidato hay **11 declaraciones externas** dentro de la cobertura del inventario, incluyendo un cargador dinámico; una tiene SRI. Son declaraciones, no once peticiones observadas.

Ejemplos verificados: Tabulator JS/CSS con versión fija y sin SRI (`docs/dashboard.html:43–44`); SheetJS dinámico sin asignación de integridad (`src/dashboard/dashboard-main.js:1676–1693`); Tailwind sin versión en `docs/informe-ejecutivo.html:23`; el grafo del panel sí tiene versión, SRI y `crossorigin` (`docs/panel.html:1990`). El dashboard ya contempla degradación sin Tabulator: no propongo duplicar ese fallback.

**Código ejecutable:**

```sh
python tools/external_inventory.py /ruta/al/repo --baseline evidence/external-baseline.json
node tools/verify_served.cjs https://host-publico/ruta/ MANIFIESTO_LOCAL_CONFIABLE.json ./auth-ui.js ./estado-idb.js
```

El inventario es offline: inspecciona scripts/hojas de estilo declarados en HTML de primer nivel y el cargador conocido de exportación. Detecta cambios semánticos y omite desplazamientos de línea. No cubre cualquier URL construida dinámicamente. No reemplaces automáticamente el baseline para lograr verde.

El segundo control compara respuestas HTTP con hashes del manifiesto de un **SHA local confiable**; nunca toma simultáneamente hashes y código del mismo servidor como única autoridad. Omite credenciales, rechaza redirecciones, no reintenta y limita por defecto cada recurso a 4 s/8 MiB. Valida también los límites configurados. Normaliza CRLF en texto según el contrato del manifiesto existente. Comprueba recursos seleccionados por red; no certifica los bytes de una caché SW del cliente.

**Pruebas.** Cambiar versión/SRI o añadir otro CDN provoca exit 1; insertar un comentario no genera falsa alarma. Cuatro recursos reales de v643 servidos por HTTP local pasan; cambiar `auth-ui.js` conservando HTTP 200 produce exactamente un `HASH_MISMATCH`. También se rechazan 429, cuerpo alterado, fallo de red, timeout, exceso de bytes y rutas fuera de la base. Evidencia: `served-local.log`, `tool-tests.log`, `inventory-tests.log`.

**Investigación externa ejecutada.** Cuatro GET públicos: metadata npm, tarball y dos archivos de jsDelivr. Verifiqué SHA-512 del tarball contra la metadata npm y comparé los dos archivos byte por byte. Coinciden con Tabulator 6.3.1:

```html
<!-- REFERENCIA INVESTIGADA: no cargues esto además del Tabulator existente. -->
<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@6.3.1/dist/js/tabulator.min.js"
  integrity="sha384-SKSq3cuuVWdfrjtLz9wNlqE0bMc903yMS5zGnFtwvfddplgxa1hywtiLyw1CbSHO"
  crossorigin="anonymous" defer></script>
```

SRI de CSS y tamaños constan en `evidence/cdn-mirror.json`; `tools/research_cdn.py` reproduce la comparación. Esto comprueba correspondencia con el paquete de npm, no que el paquete esté libre de defectos. No comprobé los bytes de unpkg ni un cambio de proveedor funcionando en los navegadores de clientes. Antes de usar este HTML hay que contrastar CSP/CORS, degradación y evitar doble carga del global. Dos CDNs del mismo paquete pueden diversificar distribución; conservan un fallo común en el paquete/publicador.

**Si falla / coste / retirada.** El auditor falla sin modificar el producto. Inventario: cero red. Verificación HTTP: una petición por recurso seleccionado, sin polling. La investigación del espejo es puntual, no tráfico nuevo de clientes. Retirada: borrar herramientas/baseline. Añadir fallback de CDN al runtime queda fuera de esta entrega: no se ha demostrado necesario ni libre de interferencias.

## 3. Preguntar al SW que controla la página, sin inferirlo de una etiqueta

**Estado: PROBADO AISLADAMENTE. Uso inmediato en QA de actualización.**

**Problema.** `version.json`, el título o el SW que está esperando no prueban qué SW controla la página. El protocolo ya existe en `docs/sw.js:390`; no necesita un endpoint externo nuevo.

**Código:** `tools/controller.cjs`, función `shellControlador(page)`. Su núcleo:

```js
const controller = navigator.serviceWorker.controller;
// Escuchar antes de enviar; deadline de 2 s y limpieza al resolver/rechazar.
if (event.source !== controller || event.data?.tipo !== 'shell-actual') return;
if (navigator.serviceWorker.controller !== controller)
  return finish(Error('Cambió el controlador; repetir lectura'));
finish(null, event.data.shell);
// La consulta usa controller.postMessage({tipo:'que-shell'}).
```

**Prueba.** Chromium real, SW instalado en localhost y manejador de mensajes extraído del SHA v643; constante de versión parametrizada como fixture v640. La página sintética se rotula v643, pero la consulta devuelve `f123-shell-v640`. Sin controlador, falla en vez de afirmar éxito. Se ejecuta junto al observador con sink roto y a las pruebas de IDB.

**Si falla / coste / retirada.** Un timeout o cambio de controlador hace fallar el paso de QA. No fuerza activación, recarga, registro, purga ni acceso a datos. Una consulta por llamada, sin reintentos automáticos. Basta retirar la función; el protocolo del producto no cambia.

**Límite importante.** No acredita actualización automática v640→v643, Firefox ni una PWA instalada. Un intento preliminar de fixture no acreditó la transición y se conserva como `evidence/discarded-update-probe.log`; no se cuenta como prueba verde de adopción. Para esa aceptación hace falta el perfil sintético realmente instalado en la versión anterior, sin inyectarle el código nuevo.

## 4. Barrera local antes de leer el espejo: pieza para estudiar el 507

**Estado: PROBADO AISLADAMENTE como primitiva; no es un arreglo completo de CAS.**

**Problema.** Los guardados del espejo y las lecturas tienen órdenes distintos: `_cola` encadena escrituras (`docs/estado-idb.js:122–124`), mientras `leer()` no espera esa cola (`:204`). Una lectura puede observar la revisión anterior aunque haya una escritura local pendiente. La clasificación de conflicto frente a cuota y la seguridad del rebase siguen siendo responsabilidades del consumidor.

**Diff:** `patches/idb-local-barrier.patch`. Añade únicamente una API; ningún consumidor de la app se cambia:

```js
async function leerTrasGuardados() {
  if (_reloj) { clearTimeout(_reloj); _reloj = null; }
  volcarPendiente();
  await _cola;
  return leer();
}
// Exportar leerTrasGuardados en OCEstadoIDB.
```

**Prueba.** Módulo real del candidato con IndexedDB nativo en Chromium. Un hook de test retrasa la escritura antes de iniciar su transacción: `leer()` ve 6; la nueva función permanece pendiente y, al liberar el guardado, devuelve 7/ACK true. Dos guardados agrupados terminan en 9 con ambos ACK true. Si el espejo rechaza la siguiente escritura sintética, devuelve la revisión previa 9 y el ACK de escritura sigue siendo false: esperar no inventa éxito. Código propuesto servido en memoria; el archivo del producto no se modifica.

**Si falla / interacción / retirada.** Solo cubre escrituras representadas por la cola de esa pestaña al invocarla. No drena las colas de otra pestaña, no bloquea nuevas escrituras, no crea una transacción atómica de lectura/rebase/CAS y puede esperar a IDB. La prueba no convierte esa espera en una nueva garantía de latencia. Si guardar falla, leer puede devolver un snapshot viejo o null.

**No integrar al rebase todavía.** Conservar CAS y las guardas contra bajar revisión. El consumidor debe verificar licencia/cuaderno, época y lease después de esperar, y distinguir copias de otra identidad. La revisión detectó que el espejo IDB usa la clave fija `f123_estado/estado/actual`, mientras A/B añade sufijo de cuaderno; una revisión superior no prueba pertenencia al cuaderno. No propongo migrar ese esquema dentro del sellado. Falta la prueba completa de rebase con ese control de identidad y exactamente un movimiento confirmado. Retirada antes de integrar consumidores: eliminar la API añadida; no toca datos guardados.

## Evidencia común y ejecución

El paquete necesita Node, Python 3 y el Playwright ya instalado en el repo. No añade dependencias a la app. Tras extraerlo, el operador Claude/OpenCode puede ejecutar:

```sh
F123_REPO=/ruta/al/candidato F123_CHROMIUM_EXECUTABLE=/ruta/opcional/a/chromium node run.cjs
```

Omitir `F123_CHROMIUM_EXECUTABLE` para usar el Chromium de Playwright. Los paths de Windows se configuran con las variables equivalentes del shell del operador. El paquete no incluye el checkout ni node_modules. Cada ejecución nueva registra shell, hashes actuales y SHA Git cuando está disponible en `evidence/execution-context.json`; `source.json` conserva la procedencia del ensayo original. No ejecutar los fixtures sobre perfiles de clientes.

**CONFIRMADO sobre v643:** siete pasos declarados, siete ejecutados, siete pasan, cero NOT_RUN (`support-summary.json`). Es un control local de herramientas/protocolo, no el denominador del sellado completo. Dentro hay diez pruebas de herramientas, la regresión de inventario externo, pruebas HTTP/Chromium y doce pruebas adyacentes del repo; los resultados detallados están en `evidence/`.

**Recuperación adicional ejecutada sobre el SHA v643:** canal/selector/adaptador Firebase, AES-GCM/Yjs e IDB reales; REST Firebase simulado y Supabase indisponible simulado. Se cierra el emisor antes de abrir un receptor nuevo. Se recuperan seis productos a 7 y se leen a 7 desde IDB nuevo; siete fragmentos, 1.425.555 bytes de cupo, cero errores de cuota. No prueba el ingreso por PIN/UI ni Firebase/Supabase vivos. `test/cold-receiver.cjs` y `evidence/cold-receiver.log`.

**Interacción comprobada:** observador averiado + fetch + barrera IDB + consulta SW en el mismo navegador, sin que falle el flujo. El lanzador incorpora inventario, hashes servidos, prototipos y recepción fría y comprueba el resultado de cada subproceso. No incorpora nuevos escritores de estado en la app.

Fuentes oficiales consultadas: [Playwright Network](https://playwright.dev/docs/network), [MDN SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity), [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), [OpenTelemetry: datos sensibles](https://opentelemetry.io/docs/security/handling-sensitive-data/). Copias en `research/`. Playwright advierte que un SW puede ocultar peticiones a `route`: separar ensayos de red con SW bloqueado de ensayos del SW real. No ocultar esa diferencia al reportar resultados.

La revisión independiente examinó el código y los logs, encontró el contador mutable y comprobó su corrección; no repitió la suite completa. Señaló también los límites de cola local, identidad, cobertura del inventario y sinks personalizados. La evidencia está ligada al SHA y hashes de `evidence/source.json`.

## Decisiones para Claude

- **Aprovechar ahora:** el manifiesto de QA con fallo deliberado, la observación sin datos sensibles, el inventario de CDNs, la verificación con hashes locales confiables y la consulta al controlador. Son herramientas de ingeniería, no nuevas dependencias del producto.
- **Verificar en su candidato:** integración segura del acceso central y del rebase; Firefox, Opera, WebKit/Safari, PWA, pestañas con sesiones reales y actualización desde una versión anterior instalada; proveedores vivos en salas sintéticas y aceptación PC↔móvil. El control completo permanece SIN COMPROBAR, aunque el control local pase. Véase `seal-scope.json` para los pendientes explícitos.
- **Dejar fuera del sellado:** otro SDK de telemetría, otro relay, un segundo escritor, doble carga de librerías, fallback de CDN sin necesidad demostrada, cambios de esquema y cualquier promesa de «0 % de conflicto». Los proveedores, cuotas, historial, PIN y datos del producto permanecen intactos.
