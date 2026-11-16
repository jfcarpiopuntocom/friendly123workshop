# Relevo técnico Sol 6 · fortalecimiento de ensamblaje v783 (16 nov 2026)

**Destino único de programación:** `jfcarpiopuntocom/friendly123workshop`, componente cliente `projects/assembled-v783/app`, Worker `projects/assembled-v783/relay`. **Este informe es del SHA efectivamente subido a main, nunca de un contenedor temporal.**

## Resumen ejecutivo

Se preservaron todos los injertos comerciales existentes de Codex (Yjs / y-indexeddb / y-partyserver Owner-private, autoridad Team, Dinero 2.0.2, Workbox diferido). No se modificaron `mock-backend.js`, `sync-yjs.js`, `index.html`, `sw.js`, el Worker ni ninguna copia de datos. Se corrigieron **4 puntos de QA/ensamblaje** que impedían verificar con fiabilidad la candidata: hashes de manifiesto, utilidades forenses omitidas, dependencia dev-only IndexedDB y una fixture que omitía una función real del HTML.

**La aplicación de clientes NO fue publicada ni migrada**. La arquitectura importada permanece **WIP/NO-GO comercial**: aún faltan proyección/privacidad por rol, comandos comerciales tipo operación + `opId`, ACK remoto de bytes fotográficos, convivencia de versiones, autorización cloud real y pruebas PC↔Safari/Opera. Una CI verde de operaciones sintéticas no cambia este límite.

## Commits / PRs / verificaciones SHA exactas

| Entrega | Evidencia RED→GREEN | Archivos tocados | Conclusión |
| --- | --- | --- | --- |
| [PR #21](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/21) → `68c20fe7e2f3ebcac0fd39f7d8d1a61123818450` | [Action #43878332282](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43878332282), 2 invariantes de integridad RED→GREEN | `app/docs/version-manifest.json`, exactamente 2 hashes regenerados por `scripts/gen-manifest.js` | No altera código monetario ni SW |
| [PR #22](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/22) → `96d444df0599c48e10ffc88813eee452a898baf8` | [Action #43879300111](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43879300111): 3 archivos `MODULE_NOT_FOUND` en RED, **18/18 PASS** en GREEN | `app/lab/stock-journal/{forensic-reconciliation,legacy-preflight}.cjs` y `app/scripts/forensics/fiados-readonly.cjs` | Solo lectura, bytes idénticos al repositorio público `friendly-123@94a4e047` |
| [PR #23](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/23) → `c705cb8740999903888b04757ee07d428ef61e94` | [Action #43880118002](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43880118002) RED→GREEN **10/10**; [revalidación mínima #43881060676](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43881060676) **10/10** tras `npm ci` | `app/package.json`, `app/package-lock.json` | `fake-indexeddb@6.2.8` en devDependencies ÚNICAMENTE; lockfile original restaurado salvo 11 líneas de módulo nuevo, sin borrar 48 metadatos `libc` |
| [PR #24](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/24) → `8a638cd0bd4a5f27e613d879715cadef43fef717` | [Action #43882873827](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43882873827): casos de gasto en RED previo, **3/3 PASS** en GREEN | `app/test/dashboard-monthly-expenses.test.js` (solo test) | Fixture VM carga `argHtml` **real** del archivo fuente; no se cambian importes o UI |

Las acciones temporales para reconstrucción se eliminaron del árbol antes del merge de cada PR. GitHub Actions conserva su evidencia histórica.

## Auditoría integral, sin esconder fallos

- [CI financiera y de autoridad #43881551715](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43881551715) sobre `c705cb874` **SUCCESS 483/483**: autoridad 105, navegador 8, doble pestaña 5, stock/fiados 22, dinero previo 28, financiero ampliado 234, fotos 33, roles/IDB 21 y relay 27. 0 fallos/omitidos.
- [Auditoría global #43881551853](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43881551853) sobre el MISMO `c705cb874`: candidata **3180 pruebas / 3116 aprobadas / 60 fallidas / 1 cancelada / 3 omitidas**. Base independiente `910affee`: **3148 / 3077 / 67 / 1 / 3**. Ambas suites ROJAS.
- Comparación literal de los 61 nombres de fallos reportados de candidata y 68 de base: **0 nombres exclusivos de candidata**; hay 7 exclusivos de base relacionados con módulos que ya restauramos, fixture `fake-indexeddb` y concurrencia. Igualdad de nombres NO demuestra que la causa ni el impacto de cada fallo sea idéntico: revisar mensajes, trazas y versiones. Ni los 60 comunes ni el timeout/cancelación se descartan.
- Después de [PR #24](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/24), una nueva auditoría general empezó bajo otro SHA. **No afirmar PASS global sin leerla cuando termine**.
- Hay 14 fallos heredados que dependen de `app/sitio-friendly123/official-app.mjs` (Worker de redirección legada), varios de workflows históricos inexistentes y tests que hacen `git show b8bd538` (el commit histórico no está en el repo nuevo). **NO copiar automáticamente esos scripts de redirección ni inventar historia de Git para “poner verde”**: podrían afectar rutas PWA/perfiles. Otros casos nombran `argHtml`, `loteAnexosPiloto`, `programarRetorno`, funciones del shell y claims de sesión y pueden requerir primero restaurar el contexto real de la fixture.
- Los fallos de stock, nombre, roles y deuda que **sí reproducen comportamientos funcionales** siguen pendientes de autopsia individual; no marcarlos como simples falsos positivos por comodidad.

## Contratos que NO se relajan

1. `opId` durable, stock/dinero una sola vez, reintentos idempotentes y fallback local verificable. Un `403`/timeout/`false` no es ACK ni permiso de borrar una venta.
2. El `YProvider` importado y su `AuthorizedYProvider` con tickets nuevos solo acreditan **Owner-private** bajo Workerd/issuer sintéticos. No habilitar `cat/ops/fotos` por licencia+instancia ni copiar documentos Yjs con PIN/costo/contactos a empleados; faltan límites por documento y comandos comerciales autorizados.
3. `Yjs.synced` o `estado-durable` confirman solo estado del CRDT en la prueba, NO una venta comercial/recibo/foto byte-exacta. Foto requiere hash, bytes, readback remoto y ACK propio.
4. El proyecto de workshop está en repo PÚBLICO: no incluir tokens, PINs, licencias reales, capturas ni fotos de clientes.
5. Nunca desplegar a `friendly-123/master`, ni activar en producción los Workers/relay/issuer sin demostración de revocación en recepción, emisiones por rol, reconexión, failback y dos rondas físicas A→B→A. La PWA sigue aplazada.

## Próximo relevo para Codex, Claude, Fable, Sol

Leer `AGENTS.md` → `projects/assembled-v783/START-HERE.md` → `projects/assembled-v783/STATUS.md` → este informe. Verificar SHA de `main` de nuevo antes de empezar: no revertir merges o repetir los cuatro arreglos. Encender primero suites sintéticas sobre SHA exacto. Si se sigue la integración comercial: **prioridad 1** frontera de privacidad y roles `cat/ops/priv/fotos`; **prioridad 2** comandos de negocio tipados con `opId`/ACK verificable; **prioridad 3** foto remota bit-exacta y outbox de reintento; **prioridad 4** convergencia/race/failback en navegadores y validación física; **PWA después**.

Para estos cuatro arreglos el runtime quedó byte-idéntico al de Codex salvo hashes actualizados del manifiesto; se ampliaron únicamente pruebas, forensics y el lockfile de desarrollo. No hacer un nuevo “ensamblaje v783” en una subcarpeta paralela, ni copiar v781 encima de `projects/assembled-v783/app`.

**Veredicto:** fortalecimiento de verificación y conservación completado; **certificación de producto e integración comercial remota NO completadas (NO-GO)**.
