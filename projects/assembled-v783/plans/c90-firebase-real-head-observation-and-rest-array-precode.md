# C90 · Observación real del HEAD Firebase (solo lectura) + certificador acepta la forma array REST de /k

**Agente:** Claude CLI · **Fecha:** 20 nov 2026 · **Base producto:** master `b56d560c` · **Rama/PR:** `port2/20261120-c90-firebase-rest-array-checkpoints` → https://github.com/jfcarpiopuntocom/friendly-123/pull/890 (`783281a9`)
**Reservas respetadas:** #841, #868, #871, #888, #889 (ninguna toca `tools/firebase-frozen-certifier.mjs`).

## PRECODE
- Archivos: `cloudflare-yparty-worker/tools/firebase-frozen-certifier.mjs` (collectOrderedRecords), `cloudflare-yparty-worker/qa/p0-firebase-frozen-certifier.test.mjs` (test C90).
- RED: `k` como array REST (`[null,k1,k2]`) → `invalid checkpoint map`.
- GREEN: array → rev por índice; índice 0 debe ser null; huecos no se inventan; entradas mal formadas fallan cerradas; mismos SHA que la forma objeto.
- Aceptación: 4/4 certificador, 1/1 score test, validador 92.0/80.0/GO 0/6 sin cambio.

## Evidencia real (agregados; sin licencia, sala, PIN ni datos)
- Firebase CLI 15.37.0, OAuth; proyecto `friendly-123-ab7b3`, instancia `friendly-123-ab7b3-default-rtdb`. `/f123`: 148 nodos (60 `-y`, 30 `-ops`).
- Testigo HEAD (conteo + SHA de claves) antes = después en `-y/k,-y/o,-ops/k,-ops/o,legacy/k,legacy/o` (5/1976/76/77/195/678).
- `-ops` CERTIFICA: 153 frames, 227 opIds, pendingStructs 0, pendingDs false, sin checkpoint obsoleto; tipos: ajuste 168, venta 55, cancelación ex-post 3, cierre-día 1.
- `-y` NO certifica: 1 grupo tag 3 huérfano (3/20 piezas, ~14 días). Sin él quedan 18 escritores con ancestro faltante (~458 KB en espera). Contiene raíces económicas (`hechos_financieros` 489, `ventas`, `clientes`).
- Legacy 1.0 (JSON, misma clave): 52 opIds económicos; 47 en `-ops`; **5 solo en legacy** (3 ventas, 2 ajustes).

## Veredicto
HEAD económico completo **NO CERTIFICADO**. Puntos: sin cambio (92,0 / 80,0).

## Siguiente cambio mínimo
1. Certificación de unión: `-ops` ∪ legacy 1.0 (5 hechos) ∪ `hechos_financieros` de `-y`, por opId, con duplicados detectados.
2. Recuperar el fragmento huérfano de `-y` desde el outbox del aparato que lo emitió (marcado `huerfano` en IndexedDB), sin borrar nada local; volver a certificar.
3. Solo después: paquete R2 + Worker fuente + Service Binding QA.
