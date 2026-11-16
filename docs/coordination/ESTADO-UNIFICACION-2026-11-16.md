# Relevo central — unificación del coding en friendly123workshop

**Fecha:** 2026-11-16 · **Autoridad:** petición explícita JFC: «desde ahora quiero que vaya todo a friendly123workshop repo ya existente, para que dejen de estar dislocados tu y Codex y mis Claudes, etc!!! ahi vamos a hacer todo el coding desde ahora en subcarpetas!».

**Destino único:** https://github.com/jfcarpiopuntocom/friendly123workshop (PUBLIC). Rama de trabajo `integrate/browser-injertos-20261116`; respaldo del main original `backup/workshop-before-unification-20261116` desde `32bfa09c2970ac8fb8abcabf1787ec500f508bca`.

## Procedencia / estados verificables
- Workshop `main` legado: `32bfa09c2970ac8fb8abcabf1787ec500f508bca` (NO alterar sus `docs/` ni herramientas Claude).
- friendly-123 público `master`: `94a4e047cdb0b2b14cbab004de599d7e43fef79b` = v781, **fuente pública**, importa/usa exclusivamente dentro de `apps/friendly-123/` con referencia exacta.
- friendly-123 candidato v782 archivado: `f6276adac490f0610e130afec0615f98acd4b32b` en `friendly-123-injertos` **PRIVADO**, NO copiado a este repo público sin revisión. QA browser 117/117 sobre v782 en CI [#43809523251](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/43809523251); no prueba v783.
- Codex v783: parche descrito localmente `candidate.patch` SHA256 `987b1d2c83666b7729c4c31a36a41d12a3ff47bc16e40639a4b6e033c811fa62`, importados `imported-sources.tar.gz` SHA256 `04e799e4271c2ffbde84058cbee992115555854c4bfb8ed9aa8b4171ae776817`. **Los archivos reales aún no están aquí**; Codex debe auditarlos por datos sensibles y aplicar los cambios reales dentro de las subcarpetas de este repo, con PR a esta rama.
- QA origen (solo lectura): https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/4 . Paquete v782 privado de laboratorio: https://github.com/jfcarpiopuntocom/friendly-123-injertos/releases/tag/qa-browser-v782-be1bf6b1b765 . **NO** trasladar directamente ese ZIP de repo privado a este público.

## Acuerdos para Codex / Claude / Sol / Fable
1. No crear nuevas ramas de ejecución en los repositorios anteriores; revisar material allí de solo lectura.
2. Subir cada injerto como commits/PR con rutas claras bajo `apps/`, `injertos/`, `qa/`; evitar nuevas copias en raíz.
3. Convergencia de toda la app desde el mismo código, no varios `docs/index.html` activos de nombres distintos; ningún doble escritor financiero.
4. La PWA queda para mañana; no cambiar `docs/sw.js` ni manifest hoy ni editar el `docs/` legado del workshop.
5. Seguridad y conservación: todas las 22 claves comerciales, 9+ IDB, fotos originales, outbox, backups, mismo PIN/rol; ninguna migración destructiva.
6. No usar secretos en repositorio público, ni convertir rol cliente en autorización de Worker. 0 frames privados sin capacidad real.
7. Gates browser: escenarios E2E Chromium/WebKit, Opera/Safari físicos, IDB durabilidad y crédito/centavos, comisiones, no duplicación, acceso, foto hash/readback, remoto ACK y corte seguro. `117/117` histórico no acredita cambios posteriores.
8. Publicación de producción requiere candidata integrada y evidencia del SHA exacto, no solo informe «Codex terminó».

## Bitácora / quién toca qué
- Sol/ChatGPT: establecer estructura y ruta de importación desde fuente pública y tests sintéticos, sin tocar prod.
- Codex: injertos comerciales v783 ya en su workspace — ponerlos en estas rutas con SHA real y revisar si contienen fuentes privadas.
- Claudes / demás: revisar y corregir contra las mismas rutas y el mismo SHA; registrar resultado en `docs/coordination/`.
- Relevo Notion: https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902 .

**Estado verificable de la importación:** solo completar tras observar el commit/CI del nuevo repo. No inferir resultado a partir de este documento.

## Verificación final de base importada — GitHub Actions 16 nov 2026

La ejecución [#43813598515](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43813598515) concluyó **SUCCESS** en SHA exacto `c13c57a20a232cdfd9742500ad8c359d7d37a6cf`, CI del **NUEVO repositorio único**, no de un repo anterior. Logs: bloques **8 + 5 + 22 + 28 + 33 + 21 = 117/117 PASS; 0 FAIL**. Incluye Playwright Chromium/WebKit sintético (SW bloqueado), venta/offline/recarga/crédito/abono/comisión, dos pestañas, movimientos stock/fiados, dinero, foto y roles/IndexedDB.

La fase RED previa se debía a dos errores de portado del arnés, **no a fallos comerciales**: faltaba copiar `lab/stock-journal/` (cuatro archivos públicos, trasladados SHA idénticos), y el test importado había sido adaptado a firma futura CAS v782 en vez del contrato original v781. Se restauró la prueba nativa v781; ninguna operación del backend se cambió para «pasar» el test.

**Limitación NO negociable:** este verde certifica SOLO la base pública **v781** importada y casos sintéticos. NO incluye ni certifica los injertos comerciales v782/v783, emisor WS Team real, fotos remotas reales, operador de comercio en iPhone físico ni sync A→B→A. Codex debe traer los commits finales v783, pasarlos por revisión de secretos (repo PUBLICO), y repetir la suite **sobre el SHA nuevo**. Rama protegida por proceso, PR #17 sin merge/despliegue.
