# friendly-123 — C56 y C57: cierre verificable en la MISMA app 1.0→2.0

**Corte Ecuador:** 2026-11-19 (GitHub/Cloudflare UTC 2026-11-20). Fuente única de código productivo: `jfcarpiopuntocom/friendly-123`; `friendly123workshop` sirve SOLO de plan, pruebas, evidencia, continuidad. **Sync3 sigue integrado** y ambos switches comerciales QA permanecen **OFF**.

## Dos métricas oficiales independientes y con un decimal

| Indicador (rúbrica invariante total100,0) | Antes C55 | C57 verificado | Cambio |
|---|---:|---:|---:|
| Capacidad integrada de portar la misma app 1.0→2.0 | 90,5/100,0 | **91,0/100,0** | **+0,5** |
| Calidad arquitectónica | 78,3/100,0 | **78,5/100,0** | **+0,2** |
| GO comercial | 0/6 | **0/6** | 0 |
| Ensayo físico PC Opera ↔ Safari/PWA iPhone | 0/5 | **0/5** | 0 |

**Fijo 100,0**: grupo `offline-failback` peso5,0; `verified-cross-device-downpath` pendiente1,5 repartido en `c56-workerd-commercial-three-receipts-a-b-a-qa` **0,5 DONE** (fuente `src/port2-cross-device-failback.mjs`) y `verified-cross-device-downpath` **1,0 FALSE** para dos ciclos físicos reales. Total pendiente migración **9,0**. Calidad `sync`15,7→15,9/20 por verificación SQL real Workerd, dimensión `physical`0/5, resto sin cambios. No se acreditan hechos Firebase/R2 real, cash real, device real ni GO.

**Scorecards finales leídos directamente en `friendly-123/master` tras PR #857**:
- `docs/engineering/architecture-2-port-score.json`: `score:91`, `maximum:100`, `assessedProductSha:18ba9ee5b1b575488dfe4ec34a1855bbb009a7e5`, pesos100, pendiente9, `commercialGo.certifiedGates:0`.
- `docs/engineering/architecture-2-quality-score.json`: `score:78.5`, mismo `assessedProductSha`, `sync:15.9`, `physical:0`, `previousScore:78.3`.

## C56 · el test rojo que impidió confundir un outbox con dinero

**Hallazgo raíz**: vieja [PR #854](https://github.com/jfcarpiopuntocom/friendly-123/pull/854) tenía 11/11 CI sobre versión anterior C52, pero solo comprobaba `opsMap.size===0` y `puedeDespacharOpEnLegado===false` (vallas/anti-replay), NO recibos comerciales ni caja y existencias verificadas. Con C54 nuevo, sus expectativas `API.canal` viejo activo eran equivocadas. Auditoría escrita en [comentario GitHub](https://github.com/jfcarpiopuntocom/friendly-123/pull/854#issuecomment-7030898573). **#854 CERRADA SIN MERGE**, reemplazada por C56.

1. [Plan C56 PRECODE](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c56-c53-real-workerd-economic-readback-precode.md) primero.
2. [RED Actions 44678705439](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44678705439), head `f1c6b2ff3c6369c38abc10d1b85df2b30d3094ea`: **primera venta NO tenía `business-committed`**. Ruta original usaba `cloudflare-yparty-worker/src/index.js` sin baseline económico; `WS_TEST_ONLY_INTERNAL_SEED` no opera en Worker real. Sin baseline certificado el backend DEBE fallar cerrado.
3. **Ponytail GREEN SOLO QA:** reutilizar el fixture existente `qa/fixtures/seeded-real-yparty-business-worker.mjs` (ya probado en C49) que instala baseline de apertura de **5 unidades, 500 centavos de caja, fiado 3.000** con SHA independiente **sintético** antes del primer commit. Subclase test-only omite import de Frozen Yjs `-ops` en esa QA, **preservando `-cat` congelado**, porque el origen histórico no está anclado a la contabilidad certificada. Nunca afirmar que ambos historiales fueron reconciliados. No se tocó fuente funcional Worker, Sync3, dinero comercial, PIN, Cloudflare R2 o datos clientes.
4. **Fallo intermedio de arnés** [Actions 44678921976](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44678921976): 3 recibos ya se obtuvieron, pero la consulta de inspección al Workerd usó GET y recibió 426; se cambió a POST con Origin (misma ruta madura C40).
5. [GREEN Actions 44679028373](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44679028373), HEAD final `dda644b448542bb67c329f5e73179ce0a4a3084a`, test `cloudflare-yparty-worker/qa/p0-c56-commercial-cold-failback-receipt-workerd.test.mjs` **1/1 PASS, 0 fail, 0 skip (2,29 segundos)**. En dos dispositivos **virtuales** (Owner A/B), A venta y ajuste, B venta, A regreso y reintento mismo `opId`: **3 recibos `business-committed`**, SQL real Workerd **stock5→4→9→8; caja500→3500c; efectos3, recibos3, fiado3000 sin variación; replay no duplica**. C54 guarda viejo `API.canal` en 0 durante2.0 y lo reanuda una sola vez en logout.
6. [PR #856 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/856) en producto **`master@18ba9ee5b1b575488dfe4ec34a1855bbb009a7e5`**, **11/11 workflows verdes** en final SHA; Cloudflare Workers Builds exact C56 SHA **SUCCESS**, UUID `efe7435a-0c54-411e-8d89-d98ae93c3969`.

## C57 · puntuación con TDD y evidencia en fuente real

1. [Plan C57 PRECODE](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c57-c56-business-cross-device-qa-score-fixed100-precode.md) previo a cambios.
2. Score-only [PR #857](https://github.com/jfcarpiopuntocom/friendly-123/pull/857), **RED Actions 44679617096** `90.5 !== 91` (no cambiar score sin código fuente C56 ya fusionado). Dejó invariante presupuesto100.0. Corrigió `migration.previous`7.5→7.7 en la nueva revisión (no cambió migration score7.7); única dimensión ganada calidad `sync` +0.2.
3. **GREEN** head final `da79a0d59a2431441b0c935fd76f6e355b517bcf`, **11/11 GitHub workflows SUCCESS** incluyendo score C12/C30, sales concurrentes Chromium/WebKit, release-control, Sync3/hotfix. Acreditó SOLO 0.5 nuevo nivel de evidencia Workerd a partir del presupuesto original de downpath1.5, con 1.0 pendiente para PC↔iPhone físico. Evidencia de milestones pinned en el SHA funcional C56.
4. **PR #857 MERGED** en producto `master@f7d084e526f658f44d35b38c0785241b867180ea`. **Cloudflare Workers Builds SUCCESS del SHA exacto** UUID `4201e43d-5622-406f-a75c-18428ce52c84`. PR857 solo score JSON, validador, test y docs; versión de app se conserva **v0.8.23 shell v823** (no nuevas mutaciones runtime).

## Limitaciones vinculantes y próximo corte Ponytail

- **Historial Firebase HEAD real completo + binding R2 =4,5 puntos todavía pendientes** (2,5 +2). No existe prueba de integridad comercial de cliente (causalidad, hashes, opIds, dinero) que habilite esas puertas, ni identidad/PIN y corte comercial físico. Faltan 9,0 puntos de capacidad total y 6 puertas GO.
- El **baseline económico C56 es sintético** e **intencionalmente excluye frozen Yjs -ops**, pues el código actual `src/authoritative-business-sql.mjs` rehúsa instalar baseline financiero sobre una sala DO con Yjs existente si no se reconcilió la línea de corte. No presentar esta QA como prueba de compatibilidad de dinero real con historial vivo. DO Yjs frozen+local 100+10 ya existe y fue probado antes; NO reinventarlo.
- **Ledger P0** conflicto mismo opId/distinto importe: [PR #841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) todavía RED/draft bajo reserva de otro auditor; no editar `docs/core/ledger.js`.
- Primer GO queda condicionado a secuencia A→B→A×2 **física** Opera/PC ↔ Safari/PWA iPhone, misma licencia/rol/PIN, ventas, existencia, caja, fotos y cierre/reapertura sin pérdidas; un test Workerd virtual no cuenta.
- Orden siguiente por causa raíz: **certificación real del HEAD económico e historia** (fuente exacta, origen inmutable, checksum comercial, cero pending parents), después configurar R2/Service Binding por licencia QA y pruebas físicas. Respeto de reservas Notion y sin nuevos proveedores ni apps.

**Estado final:** misma friendly-123 portada mediante injertos; avance real de rúbrica fija **91,0/100,0 de migración** y **78,5/100,0 de calidad**, GO0/6, físico0/5, Sync3 intacto. C56/C57 sellados.
