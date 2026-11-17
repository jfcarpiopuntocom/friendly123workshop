# Plan de trabajo aislado: cerrar conexión huérfana tras `IndexedDB.onblocked`

Fecha Ecuador: 16 noviembre 2026; workshop main observado `02df0b3de3cff9f858fce3677b41014f9c0872d0`. Dueño del tramo: ChatGPT. **No production GO.** Código objetivo exclusivo: `projects/assembled-v783/app/docs/sync-outbox.js`. Test RED ya existente: `projects/assembled-v783/evidence/p0-outbox-blocked-late-open.test.cjs`. Otros agentes trabajan la cola multipestaña; este cambio **NO** debe tocar `avanzado-extra.js`, ni el port a `friendly-123`.

## Antecedentes verificados antes del parche

- La PR #70 (merge `89e32b6d`) reintenta IDB reiniciando `dbPromise` tras rechazo. En un `onblocked` rechazado, IndexedDB puede abrir después: la promesa ya rechazada ignora `resolve` y deja la conexión tardía sin cerrar.
- Revisión independiente `reports/2026-11-16-independent-review-outbox-retry.md` y test `evidence/p0-outbox-blocked-late-open.test.cjs` documentan **RED 0/1**: una apertura bloqueada que luego tiene `onsuccess` deja conexión huérfana. No hay pruebas sobre clientes.
- Problemas **independientes y aún abiertos**: copia nueva localStorage vs antigua IDB (dos tests RED); historias legacy opuestas indistinguibles; carreras entre pestañas, cola manual y canario unión fría Yjs. No intentar resolverlos con esta pequeña corrección ni retirar respaldos.

## Protocolo Superpowers (RED→GREEN)

1. Crear rama propia desde SHA exacto, plan guardado ANTES de editar. No reescribir trabajo ajeno ni usar branch de port.
2. Obtener evidencia RED con test que ejecuta módulo original y secuencia `onblocked` → fallback → `onsuccess` tardío; verificar que detecta **una conexión huérfana**, no un falso resultado de durabilidad.
3. Parche mínimo solo `abrirDB`: marcar la apertura como abandonada al fallar/bloquearse. Si llega `onsuccess` tras ese abandono, cerrar `req.result` de forma best-effort sin cerrar la conexión nueva. Conservar `onerror`, reset de `dbPromise`, fallback, formato, leyendas y semántica de ACK anteriores.
4. GREEN focal con el mismo test; correr regresiones `app/test/p0-sync-outbox-idb-open-retry.test.cjs` y test abort #69; `node --check`. Preservar TAP y SHA por GitHub Actions; no alterar tests para fabricar verde.
5. Review: no introduce `onsuccess` que abra múltiples conexiones ni causa que un `onblocked` cuente como commit; verificar recargas, cierre tardío y conexión retry activa.
6. Actualizar Notion y STATUS con SHAs, enlaces CI, RED/GREEN y pendientes; si todos los gates de esta unidad pasan, PR para fusionar **solo workshop**. No portar a app principal ni publicar.
7. Reanudar por defecto los P0 que siguen: (a) preservar ambos snapshots y causalidad multi-tab sin reenvío duplicado; (b) coldjoin Yjs real; (c) business-committed app-level; (d) PC Opera↔iPhone Safari/PWA↔PC A→B→A×2. MDD 31oct vigente.

**No autorizado como resultado:** afirmar que esta unidad arregla unión fría, pérdida de ventas, convergencia, PIN, fotos o desempeño. Sin cliente/servidor en producción; no tocar SW ni manifiesto hasta un release candidato completo.

## RED comprobado antes de tocar runtime

[GitHub Actions 44006325294](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006325294) en commit `c595c6a120b55797bf98752d15a8d416f196922e`: FAILURE esperado, **0 PASS / 1 FAIL, 0 skipped**. Asersión exacta del test real: `orphanClosed` esperado 1, actual 0 (línea 25); retry activo sigue sin cerrar. Node22, no network ni secretos, TAP+SHA artefacto ID `14294482236`. Se verifica que fuente original no cierra la conexión huérfana. Esta anotación se realiza antes del parche funcional.

## Primera ronda GREEN (misma prueba, después del parche)

- Cambio aislado de fuente `projects/assembled-v783/app/docs/sync-outbox.js` commit `6c410cac4876dd351e566bee60fc1b752a8b7f48`. Variable `aperturaAbandonada` marcada al ocurrir `onblocked`/`onerror`, `onsuccess` tardío cierra sólo `req.result` de esa apertura; la nueva conexión activa no se toca. El resto del archivo se preservó textualmente.
- [CI focal 44006432418](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006432418): **SUCCESS 1/1 PASS, 0 FAIL/SKIP/CANCEL**, mismo test contra módulo real, `node --check`, artefacto TAP/HEAD.
- [CI de reapertura IDB #70 44006432451](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006432451): **SUCCESS 6/6 PASS, 0 FAIL/SKIP/CANCEL**.
- QA integrada 585 y compatibilidad abort #69 iniciadas sobre mismo commit; **pendientes en el momento de este registro**. No promover a READY ni fusionar hasta verificarlas. No confundir con status full 3250, que seguía rojo, ni con PC/iPhone reales.

## Cierre de esta unidad en WORKSHOP (no en producto)

- [PR #71](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/71) **MERGED**, squash commit exacto `1cd41a9072ce1e20704ce623611dffd4ec1378db` en `friendly123workshop/main`. Revalidado por API: closed/merged y `main` apunta a ese commit.
- HEAD de PR certificado `4d05298944ddc1ee91ca429ba4f7604fa31d4791` antes del merge. [QA integrada 44006542157](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006542157): **15 bloques, 585/585 PASS, 0 FAIL/SKIP/CANCEL** (suma de TAP: 105+8+5+22+28+248+7+8+31+1+33+21+6+27+35). Los tres gates focales completaron en ese SHA: [blocked-late 44006542100](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006542100), [open retry 44006542095](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006542095) y [abort 44006542170](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44006542170), todos SUCCESS. Primera ronda GREEN sobre cambio previo también conservada.
- No se tocó `jfcarpiopuntocom/friendly-123` producción (master observado `94a4e047cdb0b2b14cbab004de599d7e43fef79b`). Este parche **no resuelve** el problema demostrado de snapshots per-tab ni el canario Yjs unión fría; no se ha acreditado READBACK comercial `business-committed` ni físico A→B→A×2. Global histórico 3.250 / 3.217 PASS / 29 FAIL / 1 CANCEL / 3 SKIP, no es full GO.
- Proximo bloque de trabajo separado: frontera de cola manual `avanzado-extra.js` frente a Yjs; evaluar journal opId cifrado+tombstones que preserve ambas copias, sin recuperar operaciones ya confirmadas por 2xx; RED multipestaña y respaldo oculto antes de implementar. Coordinar archivo y no pisar trabajo paralelo. **No port una línea de #70 a producción mientras deje el respaldo más nuevo oculto.**
