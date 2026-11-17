# CULMINACIÓN del port a la arquitectura de injertos — SEPARADA de calidad

**17 nov 2026. No añadir ni mover gates. Objetivo de JFC: primera tienda real HOY, si seis condiciones ya aprobadas pasan.** La calidad y el port NO son la misma métrica. Conservar [score-v1.json](score-v1.json) sin mezclar.

<details><summary>Fuente exacta y repetible</summary>

- [port-v1.json](port-v1.json) es la fuente del **port operativo** por etapas y evidencias verificables.
- [port.cjs](port.cjs) valida exactamente 6 gates, 100 puntos y IDs/pesos fijos. [port.test.cjs](port.test.cjs) lo prueba. El proceso sale con código 2 si se invoca `--require-operational-go` y la app no está lista.
- [p0-port-client-worker-contract.test.cjs](../qa/p0-port-client-worker-contract.test.cjs) inspecciona **las fuentes del piloto/Worker reales**, separadas del fixture Workerd. A fecha de corte reporta bloqueo de compatibilidad; un CI verde verifica que detecta la discrepancia, NO que la app esté lista.
- Plan vinculante: [2026-11-17-operational-port-tracker.md](../plans/2026-11-17-operational-port-tracker.md).
</details>

```sh
node projects/assembled-v783/quality/port.cjs
node projects/assembled-v783/quality/port.cjs --json
node --test projects/assembled-v783/quality/port.test.cjs
node --test projects/assembled-v783/qa/p0-port-client-worker-contract.test.cjs
# EXIT 2 hasta los seis gates completos (NO ejecutar como condición de PR normal):
node projects/assembled-v783/quality/port.cjs --require-operational-go
```

## Marcador, sin inventar progreso

| Métrica | Hace una semana | Ahora revisado | Meta |
|---|---:|---:|---:|
| **Calidad y robustez de arquitectura** | 45,0/100 estimado | **64,5/100** (±4 criterio) | ≥95 |
| **CULMINACIÓN del port operativo de injertos** | No se puntuaba | **27,0/100** (hitos definidos y testados, no % de tiempo) | 100 y 6/6 gates |

**Importante:** 27,0 **NO** significa "27% de horas terminadas". Se han demostrado 27 puntos de una rúbrica de seis gates y etapas fijas: mucho trabajo de laboratorio **no está conectado** al camino real de un cliente. El historial de esta segunda métrica empieza aquí, sin inventar un valor de la semana pasada.

| Gate aprobado por JFC | Peso | Etapas probadas | Falta para habilitar |
|---|---:|---:|---|
| A. Empleado, venta/ajuste/cobro tipados, opId y ACK real | 20 | 4,0 | 16,0 |
| B. Owner/Team, servidor y ticket por canal | 20 | 10,0 | 10,0 |
| C. Foto blob SHA fuera del Yjs | 10 | 0,0 | 10,0 |
| D. Firebase→DO→Firebase completo, SHA y cero pendientes | 25 | 10,0 | 15,0 |
| E. Web Locks outbox y reanudación iPhone | 10 | 3,0 | 7,0 |
| F. Dos ciclos físicos Opera PC ↔ Safari iPhone A→B→A | 15 | 0,0 | 15,0 |
| **Total** | **100** | **27,0** | **73,0** |

**Gates comercialmente certificados: 0/6. NO-GO.** Aumentar el score solo marcando una etapa prevista como hecha, con SHA de código y URL de prueba que la sustente. Si se vuelve falsa, *quitar puntos*. El objetivo 100 y pesos se congelan en el plan.

## Bloqueo P0 DE PORT, no calidad abstracta

Revisado en los archivos de ejecución, no en teoría:

- `app/src/yparty-piloto.js`: crea `new YProvider(..., sala + '-' + tipo, ...)` con licencia/instancia estáticas. **No solicita ticket fresco ni entra a la sala privada**.
- `relay/injertos/yparty-worker/src/index.js`: al activar `WS_AUTHORITY_QA=1` solo admite `SALA_PILOTO + '-priv'` y exige `cap` de un uso. Sin emisor/autorización retorna HTTP 503/403; por diseño no debe relajar esa protección.
- `app/src/authorized-yprovider.mjs`: el injerto **correcto ya existe**, pidiendo `params()` en cada conexión y reconexión, pero todavía no sustituye al constructor del piloto. **Este cableado falta para la primera unión fría segura**.
- Los dos archivos de cliente/Worker tienen reservas de otras IA. No sobrescribir; pasarles esta evidencia y ensamblar su PR certificada lo antes posible.
- Los importadores y exportadores Yjs SQL de PR #82/#84 **funcionan en Workerd local**, pero no hay fuente Firebase real completa ni protocolo de restauración de regreso ni socket operativo cliente ↔ Worker. 15 padres Yjs pendientes del canario antiguo continúan sin certificación completa.

## Prioridad única de ensamblaje ahora

**1.** Conectar el `AuthorizedYProvider` importado al piloto con `-priv` y callback de ticket central, manteniendo recuperación/local-first y deny-by-default; probar WebSocket real y reanudación. **2.** Tipar y aplicar operaciones económicas en servidor y fotos por SHA fuera de Yjs. **3.** Importar historia Firebase completa con cero pendientes y un downpath real; **4.** Web Locks/iPhone y dos ciclos físicos ya definidos.

No agregar diseño ni tareas fuera de los seis gates. Cuando las pruebas permitan activar la primera tienda real, cambiar flag solo con orden de JFC y un GO verificable. Producción `jfcarpiopuntocom/friendly-123` intacta.
