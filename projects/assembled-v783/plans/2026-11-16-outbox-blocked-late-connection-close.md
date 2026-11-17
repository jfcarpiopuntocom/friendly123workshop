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
