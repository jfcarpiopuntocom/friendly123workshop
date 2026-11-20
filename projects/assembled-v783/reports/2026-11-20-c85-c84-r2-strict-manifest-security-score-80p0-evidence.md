# C85 — evidencia persistente QA del injerto C84 R2 estricta y score80.0 original100

**Fecha Ecuador: 20-nov-2026.** Este archivo es QA/registro de la MISMA friendly-123 portada desde arquitectura1.0 a2.0; **NO es un producto, ni port paralelo, ni contiene código funcional**. Se conserva Sync3. Cumple [PRECODE previo](../plans/2026-11-20-c85-c84-r2-strict-source-security80p0-precode.md) y reserva de archivos.

## SHA verdaderos, criterio de aceptación, resultados

- Producto fuente C84 [PR #883 fusionada](https://github.com/jfcarpiopuntocom/friendly-123/pull/883): `master@8c34cb3d40fc987d537ce2c0ba54d75d6224027b`. Su código real `cloudflare-yparty-worker/src/trusted-frozen-source.mjs` exige manifiesto V2 cuando el futuro flag opt-in `WS_R2_MANIFEST_REQUIRED_QA='1'`, rechazando V1 legacy autodeclarado; modo OFF conserva compatibilidad.
- [C84 RED fuente](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44774691139): 3/5 PASS, 2/5 FAIL por `Missing expected rejection` (no falla de arnés). C84 GREEN incluye reader Yjs real, paged V2 SHA/root, legacy V1 OFF, rechazo digests/raíz incorrectos, QA OFF sin fetch; D2, D6 Workerd, D7 packager. Cloudflare Workers Builds GET cuenta real **SUCCESS** para SHA C84, UUID `6116411e-29a2-44de-a2ab-b0757719d28c`.
- Producto [PR #884 C85 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/884) en `friendly-123/master@65d7a90b2de5b90cef1b71de2907f9d3597b5a42`. Se tocaron solo cuatro archivos de score/docs/test. [C85 RED real score](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44780907216): `79.9 !== 80`. [C85 GREEN score fijo](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44781726848) y **13/13 GitHub check-runs SUCCESS** sobre candidato final `5a10e1337ada3bf49ca47e4618c5fb5f6e829fd6` (P0, Chromium/WebKit, release). Cloudflare Workers Builds GET post-merge **SUCCESS** SHA exacto `65d7a90b2de5b90cef1b71de2907f9d3597b5a42`, UUID `c92ea80a-7119-4876-80b6-a467499c39e4`.
- Calidad arquitectónica **80,0/100,0**, antes 79,9, delta+0,1, exclusivamente dimensión Security de11,0/15 a11,1/15. Business19,0/20 permanece. Suma anterior dimensiones79,9, suma actual80,0; pesos originales100 constantes. `quality.lastAuditedProductSha` pin al injerto real C84, no al workshop.
- Transición misma friendly-123 arquitectura1.0→2.0 **92,0/100,0**, sin avance artificial C85; 8,0 puntos pendientes. GO comercial **0/6**, físico PC Opera↔iPhone Safari/PWA **0/5**, flags QA OFF. Sync3 no tocado, no nuevo escritor ni cutover comercial.

## Bloqueador original prioritario (NO auditoría completada)

El HEAD económico auténtico Firebase sigue sin examen directo: el directorio muestra plugin Firebase para Codex, pero esta sesión ChatGPT no expone ninguna acción Firebase y el permiso `Firebase` devolvió `not_installed`. No se leyeron registros económicos, cronología original, finanzas ni hash de la cabeza desde Firebase. **No hay certificación de cabeza económica Firebase**, fuente/Service Binding R2 real ni prueba A→B→A×2 física. Presupuesto port pendiente: Firebase original2,0, R2 fuente/binding real2,0, operación/físico4,0. No inventar GO ni mover datos ni activar bandera QA. El bucket QA R2 vacío C83 ya existe (no duplicar ni crear gastos). Respetadas reservas de otras IA: #871 Yjs, #868 fotos y #841 ledger.

## Fuentes persistentes

- [Score real producto](https://github.com/jfcarpiopuntocom/friendly-123/blob/65d7a90b2de5b90cef1b71de2907f9d3597b5a42/docs/engineering/architecture-2-quality-score.json)
- [Rúbrica de transición real producto](https://github.com/jfcarpiopuntocom/friendly-123/blob/65d7a90b2de5b90cef1b71de2907f9d3597b5a42/docs/engineering/architecture-2-port-score.json)
- [Marcador y justificación](https://github.com/jfcarpiopuntocom/friendly-123/blob/65d7a90b2de5b90cef1b71de2907f9d3597b5a42/docs/engineering/architecture-2-port-score.md)
- [Notion bitácora de transición](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94)
