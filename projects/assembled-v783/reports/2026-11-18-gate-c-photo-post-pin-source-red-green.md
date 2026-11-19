# PORT 2.0 · Gate C — foto SHA Owner post-PIN · RED→GREEN · 2026-11-18 Ecuador

**Workshop:** [PR #130 MERGED](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/130) source HEAD `f8f1d9462b13a61dfb20d9c5d009ee3263e7ead6`, merge `6ab4f5da9c1bd7463d98adc42318d7941a053b53`. **BASE:** workshop main `759ee1d37f5503de5c8beda3a578fd08be48934f`. **PRODUCCIÓN friendly-123:** ninguna escritura ni flag del port modificados. [Notion authoritative handoff](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94) · [Plan pre-code](../plans/2026-11-18-gate-c-owner-post-pin-sha-bridge.md).

## Bloqueo arquitectónico eliminado (sólo ensamblaje 2.0)
- `app/docs/sync-yjs.js` pedía `piloto.fotoSha()` DURANTE arranque sin Owner PIN, fijaba `API.fotoSha=null` y no volvía a adquirir el puente tras `auth-ui.js:oc-login`. Así el exitoso injerto por SHA y IDB de [PR #128](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/128) no funcionaba en entrada normal.
- El sembrador de fotos leía `OCFotos.leerPorHash` envuelto para UI y podía consumir cupo remoto de 16 lecturas o bloquearse esperando HTTP aun cuando IDB tenía los bytes.
- Un ACK HTTP tardío tras logout, cambio de licencia o **logout→login con el MISMO PIN (ABA)** necesitaba rechazo para impedir un puntero Yjs de sesión antigua. Un doc viejo destruido después del nuevo podía desregistrar el `oc-login` correcto.

## Cambio Ponytail
- Una fachada `crearPuenteFotoPerecedero(piloto,codigo)` mantiene identidad estable, obtiene `piloto.fotoSha()` sólo por operación, verifica sesión Owner con PIN vigente, licencia, instancia y Y.Doc antes y DESPUÉS de await, y además invalida por revision de eventos de login/logout/sesión de pestaña (ABA). No almacena PIN en IDB, localStorage, logs ni URL; las credenciales preexistentes se consultan en memoria de la sesión.
- `registrarResiembraFotoTrasLogin()` se llama cuando `API.fotosDoc` y fotosCanal existen, sólo actúa en Owner autorizado y su `destroy` se ata al documento exacto; un doc anterior no puede retirar el listener actual.
- El sembrador usa `__f123PhotoReadOriginal || leerPorHash` para leer sólo IDB/legacy local; la capa de UI mantiene read-through SHA con chequeo Owner ANTES de consumir el contador remoto; error de PUT conserva los bytes IDB sin añadir blob Yjs.
- Sin `piloto`, puente null y camino legado intacto; no se habilitan roles Team ni el port económico.

## Pruebas sin degradar contratos
| Evidencia | SHA/Run | Resultado |
| --- | --- | --- |
| RED original source-executed, falta fachada post-PIN | [44455822459](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44455822459) | **0/7** |
| RED ciclo de vida: antiguo Y.Doc destruye listener del nuevo | [44456435358](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44456435358) | **7/8**, un fallo causal |
| RED login ABA con mismo PIN y ACK pendiente | [workflow RED #44456928142](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44456928142) | fallo focal antes del guard de época |
| GREEN fuente Owner→SHA, logout, licencia, PIN, ABA, 2 Y.Doc, IDB local y cuota | [44457005043](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005043) | **9/9** |
| Gate C foto offline browser real Chromium ↔ WebKit | [44457005106](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005106) | **SUCCESS**, mismo SHA |
| Foto SHA signed bridge/vendor | [44457005082](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005082) | SUCCESS |
| BFCache | [44457005109](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005109) | SUCCESS |
| Frozen Yjs precut + cursor causal | [44457005344](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005344), [44457005112](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005112) | SUCCESS |
| General synthetic browser/authority and native IDB | [synthetic #44457005115](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005115), [IDB #44457005060](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44457005060) | **Revalidar conclusión final**; una corrida fue cancelada durante instalación de browsers y reintentada. No inferir GREEN |

Los resultados bajo otra fuente/CV siguen separados; instalar navegadores en GitHub Actions no es prueba de la tienda real. **Ni el test source VM ni Chromium/WebKit nativos garantizan que Safari físico en un iPhone conserve el PIN o la foto**.

## Auditoría combinada obligatoria
- Qwen 4 Max + Gemini Argon 4: [conciliación](2026-11-18-qwen-gemini-adversarial-audit-reconciliation-v801.md). El historial Firebase de 6.112 frames, 19 padres y 9 respuestas 401 continúa como deuda independiente Gate D; no resetear snapshots ni declarar HEAD falso.
- CAS de puntero de foto LIVE #777 es opcional y la UI 1.0 no lo envía; el port 2.0 debe validar readback/comando opId y conflicto A→B→C antes de certificar C3.
- Team no recibe raw Y.Doc privado de catálogo, H6 Casa exige cadena total antes de filtrar, y `stored-for-application` no es `business-committed`.
- Mantener una sola autoridad de dinero, movimientos y stock. Evitar escritores Yjs antiguos y nuevos simultáneos.
- Commercial user acceptance: Opera PC→Safari iPhone→PC A→B→A dos veces, igual licencia/PIN, fotos/caja/stock/ventas y 0 padres causalmente pendientes.

## Indicadores, inmutables
**Calidad 67/100, PORT 61/100, GO comercial 0/6.** Este fix post-PIN no acredita nuevos puntos del stage C3 (fotos físicas) ni B4 (roles reales) ni D (fuente Firebase completa). P0 siguiente: ensamblar autoridad Owner/Team con proyección segura y lectura/corte de historia actual en YParty Workerd, mantener failback y cumplir prueba física. Los seis gates congelados siguen A20 B20 C10 D25 E10 F15.
