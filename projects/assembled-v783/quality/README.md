# friendly-123 · marcador vivo de calidad y robustez (v1)

**Objetivo JFC:** alcanzar **≥95/100** *y* aprobar **6/6 condiciones comerciales cerradas**. Se recalcula tras cada cambio relevante y se publica con SHA. Esta tabla es un **índice de evaluación de ingeniería con estimaciones y trazabilidad**, no un cálculo estadístico de fiabilidad ni una predicción de fallos. Los decimales permiten seguir cambios pequeños, **no añaden precisión científica**.

## Ejecutar

```sh
node projects/assembled-v783/quality/score.cjs
node projects/assembled-v783/quality/score.cjs --json
node --test projects/assembled-v783/quality/score.test.cjs
# Solo para un gate de publicación controlado; retorna 2 mientras no sea comercialmente apta:
node projects/assembled-v783/quality/score.cjs --require-go
```

Los valores y enlaces verificables están en [score-v1.json](score-v1.json); no se escriben cifras manualmente en chats como estado permanente. El CLI compara el **histórico estimado del 10-nov** y el **código revisado en el último SHA probado**. Si el HEAD GitHub o la fuente cambian, se debe **revalidar**: un JSON versionado no consulta red ni certifica automáticamente que el último commit sea seguro.

## Rúbrica congelada antes del test Workerd del 17 nov

| Dominio | Máximo | 10-nov (retrospectivo) | 17-nov antes Workerd | Workerd Green | Último revisado |
|---|---:|---:|---:|---:|---:|
| Ventas, inventario y dinero | 20 | 14.0 | 17.5 | 0 | 17.5 |
| Durabilidad local, opId, ACK | 20 | 12.0 | 16.0 | 0 | 16.0 |
| Convergencia y unión fría | 20 | 6.0 | 12.0 | 0 | 12.0 |
| Autoridad y operaciones económicas | 15 | 6.0 | 7.5 | 0 | 7.5 |
| Fotos / PWA | 10 | 6.0 | 6.0 | 0 | 6.0 |
| Migración histórica y rollback | 10 | 1.0 | 4.5 | **+0.5** | **5.0** |
| Aceptación física dos ciclos | 5 | 0.0 | 0.0 | 0 | 0.0 |
| **Total** | **100** | **45.0** | **63.5** | **+0.5** | **64.0** |

**Intervalos de incertidumbre de criterio**: 10-nov ±5 puntos, actualidad ±4 puntos; no intervalos de confianza estadísticos. El baseline del 10-nov se reconstruyó retrospectivamente de los síntomas, registros y CI disponibles; **no posee SHA único del 10-nov**. La cifra 45.0 NO se vuelve a recalibrar para que el delta quede más bonito. El valor 64.0 NO equivale a robustez física demostrada.

### Cómo se gana un siguiente decimal

1. Registrar previamente el test RED, el contrato de negocio, el dominio afectado y la cantidad de puntos adjudicables en el plan/reserva.
2. Demostrar GREEN con URL de GitHub Actions, SHA exacto y alcance (Node sintético, Workerd/Miniflare, navegador aislado, iPhone/PC físico).
3. Actualizar **solo** ese rubro y añadir evidencia en `score-v1.json`; bajar el rubro si una regresión lo contradice. El cálculo y el histórico están sujetos a pruebas que impiden cambiar los pesos o eliminar gates sin que CI falle.
4. No elevar puntos por cantidad de tests, cambio cosmético, duplicación de pruebas, bug de arnés, una PR fusionada sin aceptación, o asumir que un inbox/ACK de transporte significa venta confirmada.
5. Para `GO` el mínimo es 95 y deben estar **los seis gates aprobados** con evidencia independiente.

### Los seis gates vinculantes del usuario (todos obligatorios)

1. Empleado no puede escribir `ops/-cat` y venta/ajuste/cobro tipados por opId, autoridad servidor.
2. Owner/Team central realmente cableado; ticket de acceso por canal.
3. Fotos SHA fuera de los documentos Yjs.
4. Un único importador Firebase→DO, SHA, cero pendientes, exportador de regreso verificado.
5. Web Locks en outbox y reanudación física iPhone.
6. Dos ciclos físicos Opera PC ↔ Safari iPhone A→B→A.

**Estado**: 0/6 acreditados al corte en [score-v1.json](score-v1.json), por tanto **NO-GO**. Esto es separado del progreso en el laboratorio.

### Evidencia que habilitó exactamente +0.5

- [PR #82](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/82) preparó el adaptador congelado Yjs→DO SQL: [Node/Yjs SQLite 9/9](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44131857267), sin Workerd.
- [Nueva prueba Workerd 2/2](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44136898372) sobre código QA `cedff564b8842db0345159bf4e7a42dbf27398e8`: Miniflare Durable Object SQL nativo; importar estado sintético, cierre completo, reinicio, mismo SHA y 3 opIds, rechazo de update hijo incompleto y conflicto; 0 fallos. No se modifica `src/index.js` ni se importa Firebase real.
- [Regresión integrada anterior 585/585](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44131873302), todavía no prueba dos aparatos reales; [auditoría completa post PR81](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44129049146): 3.287 total, 3.254 PASS, 29 FAIL, 1 CANCEL, 3 SKIP.

**Próxima frontera**: obtener Firebase HEAD realmente congelado con 0 padres Yjs pendientes y hash comprobado de origen, y cablear importador único al Worker autorizado con exportación de regreso segura; resolver roles/ventas del servidor en paralelo, fotos fuera Yjs y A→B→A físico antes del primer canario.
