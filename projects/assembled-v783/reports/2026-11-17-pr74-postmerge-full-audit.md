# Relevo sin filtros · auditoría completa post-merge PR #74 · 17 noviembre UTC

## Identidad y alcance

- [GitHub Actions 44011435291](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44011435291), workflow **Assembled candidate full app audit (synthetic, no deploy)** sobre el merge SHA exacto **`653b5c8a511bcdc715b3d68e83a26afad2284215`** (PR #74). Ambos jobs corrían la suite **completa** de la app, no el subconjunto integrado de 585.
- Candidate job `133799120066`: **3257 tests, 3224 PASS, 29 FAIL, 1 CANCELLED, 3 SKIP**. Estado job: FAILURE.
- Historical baseline job `133799120403`: **3151 tests, 3089 PASS, 58 FAIL, 1 CANCELLED, 3 SKIP**. Estado job: FAILURE.
- Las suites NO tienen los mismos tests ni tamaños; NO decir que cada una de las 29 fallas es una regresión del cambio, ni que tener menos fallos autoriza producción.
- La QA integrada separada [44011435324](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44011435324) terminó SUCCESS sobre el mismo merge SHA; mide otro subconjunto (585/585 PASS). El baseline de taller anterior a #74 tenía registro de 3250 con 29 FAIL; aquí cambió el recuento por nuevas pruebas.

## Lista íntegra de líneas «not ok» del candidato (incluye fallo agregado de archivos)

El log contiene **30 líneas `not ok`** aunque el resumen TAP reporta **29 fallos**: la jerarquía padre/archivo puede contar un test agregado además del fallo hijo. Conservar el número TAP como total autoritativo.

1. test/e2-active-user-reload.test.js
2. hotfix hands off tested SHA after promotion; broad regression cannot duplicate deployment
3. official app keeps bytes and never forwards customer headers or query
4. official app follows a new stable source automatically without another deploy
5. landing stays on its existing assets and /app keeps correct relative base
6. source failures are explicit and cannot silently serve an obsolete local app
7. source proof identifies the same promoted commit
8. friendly123.com/app/sw.js retires the old worker and never reloads a ?stay=1 tab
9. official /app and /app/ redirect directly via 307, without any origin fetch
10. new /app?entry=1 bypasses an old cached permanent /app → /app/ mapping
11. invalid double-slash HTML paths are not externally redirected
12. a deep HTML entry preserves its relative view, never arbitrary query data or license
13. JS, SW, version and immutable release proof are still served from the one stable branch
14. clients who already own a new-origin notebook retain a non-destructive escape
15. HEAD is not a login redirect, POST is never redirected, landing is untouched
16. a join invitation survives the redirect; anything else in the query is dropped
17. P0 hotfix required check invokes exact selector and executes ALL selected test files
18. test/p0-coldjoin-workflow-secrets.test.cjs
19. test/p0-hotfix-gate-contract.test.cjs
20. RED: missing GitHub workflow pull_requests metadata must NOT make a real exact-merge green look unverified
21. fail closed on unmerged, wrong-base, wrong-head or wrong merge SHA associations
22. fail closed on missing or failing exact gate even if merged PR association is valid
23. fail closed on permissions error in PR association API
24. test/p0-v603-update-consent-click.test.cjs
25. v637 manifest matches all shell files **[No aparece en RED histórico base]**
26. a new version shows no strip, never reloads, and tells the waiting service worker to take over
27. public proof records exact artifact bytes and recovery retains the already published canary
28. Sonar cannot replay an earlier PUSH against a newer master commit
29. estable y canario conviven: el canario mas nuevo NO borra la cache de los clientes
30. test/sw-dos-canales.test.js

## Comparación razonada

- De esas 30 líneas, 29 también aparecen en el log del baseline y 1 no. Esto es comparación de nombres, NO demostración de identidades de root cause o equivalencia de suites.
- **Única línea de fallo exclusiva del candidato por título:** `v637 manifest matches all shell files`. En el log: **`./sync-yjs.js`** tiene SHA real `sha256-5b98f5673df94d506959c9b05691bee0cd2915073af0423cd7a656d7c4098222` y el manifiesto espera `sha256-38837a32676b90ac9fe6ad11307e0686c5a1d3fb53777135bbf2b8f1d3d1b001`. Este desfase es **coherente con haber editado el runtime `sync-yjs.js` en workshop y NO haber sellado un release**, pero solo el empaquetado final autoriza regenerar manifiesto. Es un **release NO-GO**; no arreglar reescribiendo el test o forzando un SHA sin reconstrucción completa de assets.
- Gran parte de las fallas restantes refieren contratos de host comercial externo, wrappers y migraciones históricas no presentes necesariamente en subset ensamblado. Cada fallo debe clasificarse con fixtures y fuentes antes de descartarse. En particular las pruebas de remote-origin, PIN, cas y respaldo no se pueden sustituir por un «PASS» del test focal.
- No se modificó `friendly-123/master` ni se desplegó el producto como resultado de la PR #74 del workshop.

## Próximas tres acciones

1. Recibir del port Codex **fuentes v783 completas** (no solo patch/README) con SHA real, hashes de dependencias e importación de Dinero.js, Workbox-window, y-partyserver/y-indexeddb, autoridad Team; fusionar al repositorio privado QA browser, mantener la prioridad navegadores antes de PWA.
2. Ejecutar las ~117 pruebas de browser en **candidato final exacto v783**, permisos WS reales y readback opId/venta, dos perfiles Chromium/WebKit A→B→A y fallbacks; no confundir sintético con dispositivos físicos.
3. Sellar solo después de esos gates: manifiesto de la candidata contra `sync-yjs.js` y demás assets, auditoría completa clasificación de los 29 fail y aprobación humana; luego pruebas en 2 ciclos físicos PC Opera↔iPhone Safari antes de comercial GO.

## Continuidad

Decisiones: [MDD aprobada](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac), [war room vivo](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902), [PR #74](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/74). No tocar datos reales, no PIN, no «rescate» de snapshots sin genealogía común, no cambiar proveedor ni inventar ACK. Código comercial aún NO-GO.
