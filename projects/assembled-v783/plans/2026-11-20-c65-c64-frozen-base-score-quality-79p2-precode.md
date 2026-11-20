# C65 PRECODE condicional — atribuir solo +0,1 de calidad al injerto C64 verificado

**Misma friendly-123, mismo presupuesto original /100.** Antes de C64, master `1925ae864bb1eedd675318ffa02b7ef7815e2557`: migración **92,0/100,0**, calidad **79,1/100,0**, físico0/5, GO0/6, Sync3 intacto. Workshop solo planes/QA. Este plan existe ANTES de editar score JSON, tests o validador.

## Prerrequisito de evidencia

- [PR #864 C64](https://github.com/jfcarpiopuntocom/friendly-123/pull/864) de producto debe fusionarse sólo después de GH Actions exact HEAD full verde y Cloudflare Workers Build exact SHA fusionado; confirmar `master` y readback fuente.
- **RED1 real:** [run44731412320](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731412320) fuente `open-existing-store.mjs` aceptaba snapshotKind `none` con diario Yjs válido aunque base congelada ausente. 1 PASS/1 FAIL; fallo concreto `true !== false`.
- **RED2 real:** [run44731901974](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44731901974) con guard contra `none`, snapshot `legacy` también podía sustituir el `documento_bloques` importado. 2 PASS/1 FAIL, misma falsa aceptación.
- **GREEN source QA:** C64 exige `snapshotKind==='blocks'` en reapertura con receipt, sin tocar Sync3/cliente, ni alterar bytes legítimos de base+journal; escenario focal 3/3 PASS + Workerd real cold-join 5/5, score original intacto. No es prueba de Firebase real ni demostración física.

## Decisión de score limitada

- Si y sólo si se cumple todo: acreditar **+0,1** de evaluación de *durabilidad arquitectónica* por fail-closed de certificado fuente, no por un nuevo hito comercial. En calidad `durability` 18,4→18,5 de peso fijo20,0; total calidad 79,1→**79,2/100,0**. Es +0,1 de confianza en la fuente 2.0, no una afirmación de datos reales recuperados.
- **Migración permanece 92,0/100,0**. Los ocho puntos originales pendientes siguen sin reetiquetarse: HEAD Firebase REAL2,0, binding R2 REAL2,0, switches/fotos/corte físico4,0. GO0/6, físico0/5, flags QA OFF.
- Baseline previo calidad79,1 y ref exacto C63. No duplicar crédito C62 seguridad +0,2 ni C60 durabilidad +0,2.
- TDD score: PR score-only con test RED `test/p0-architecture-2-port-score.test.cjs` exige 92,0/79,2 y prueba el guard C64 de `open-existing-store.mjs` y test RED2, mientras JSON aún79,1. Tras RED, editar **solo** JSON calidad, validador `scripts/architecture-2-port-score.cjs`, informe score MD/port evidence refs si fuera necesario, con fuente de producto SHA certificada. Mantener original100 por dimensión. Cualquier cambio de `assessedProductSha` debe actualizar evidencias `/blob/SHA/` coherentemente, jamás fingir QA.
- Ejecutar validator CLI + test focal + regresiones del workflow y GH full CI sobre head; merge y Cloudflare SHA exacto; Notion y workshop report. Si falla precondición, no mover número.

**Reserva:** scorecards/validator/test solo en PR exclusiva C65; el ledger `docs/core/ledger.js` permanece reservado [#841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841). Fuente C64/QA no se toca en C65.
