# PRECODE · 2026-11-19 · quality score evidence after v804 Belén CAS

Vinculante: portamos la MISMA friendly-123 de 1.0→arquitectura ensamblada 2.0 mediante injertos maduros; Sync3 ya pertenece a 2.0. Workshop solo plan/QA. Real master al iniciar: `e2281fb48369e91caa49fe6576ed14610d9d61b3`. No cambiar `docs/sync-yjs.js`, `src/yparty-piloto.js`, Cloudflare, R2, ni shell.

## Evidencia real que justifica una revisión limitada de calidad
- [PR #796](https://github.com/jfcarpiopuntocom/friendly-123/pull/796) **MERGED** en producto `49fe066024ab529b182327bd98ae76884b13ded2`, sobre v0.8.04.
- [RED de foto sin preimagen](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44584824946) 20/21: la escritura sin CAS se realizó; [GREEN](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44585595331) 21/21 tras rechazarla y alinear fixture con preimagen real; SHA v804 sellado. GitHub 27/28 success con CodeRabbit skipped, cero fail.
- El control de foto actual reconoce preimagen/versión y 409 en recuperación, cámara, bóveda, y rechaza toda publicación desnuda cuando no hay preimagen. No demuestra todavía fotos remotas PC↔iPhone ni cambia catálogo público por sí mismo.

## Atribución medible
Calidad arquitectónica `photos` **6.5/10 → 7.0/10**, mejora deliberadamente acotada **+0.5** por guardar/validar CAS en los tres escritores de la interfaz; **total 72.7 → 73.2/100**. El resto de dimensiones se mantiene, `physical=0/5`. Por separado `PORT implementación=81.5/100`, porque ninguno de los hitos incompletos (browser-photo-cutover, idempotent money dispatcher, R2 cert) se logró. GO 0/6 aparte.

Cambios SOLO: `docs/engineering/architecture-2-quality-score.json` (score/dimension justificativo/enlace PR #796), `docs/engineering/architecture-2-port-score.md` (tabla/explicación/R2 actualizado), `scripts/architecture-2-port-score.cjs` (gate fuerte para crédito foto: contiene guardas de preimagen y CAS en los tres caminos, SHA256 real `docs/vista-perchas.js` == manifest, prueba real presente) y `test/p0-architecture-2-port-score.test.cjs` (RED exigencia 73.2). No cambiar el archivo de rubrica del PORT ni pesos. TDD RED→GREEN en CI exact SHA, global checks, PR y merge solo después de green; anotar Notion.

Costo permitido 0.00 USD absoluto. GitHub Actions repositorio público; no Cloudflare requests facturables ni R2 writes. Antigravity reservado C17a; no colisión.
