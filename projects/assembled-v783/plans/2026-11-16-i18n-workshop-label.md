# P0 regression: i18n header vs workshop-brand badge (not a production bug)
Date 2026-11-16. Branch test/20261116-i18n-workshop-label, parent workshop main 35efd432b7cedba66e9c983d6cb4d89f679f58c8.

## Evidence
Full historical Chromium/WebKit audit run [43965240844](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43965240844), job 133642831554: `real language buttons preserve a synchronized name and translate the location selector after redraw` failed actual header `VERSIÓN DE PRUEBAS` vs expected `Fixture synchronized business` (`test/i18n-header-nombre.test.js:155`). The same explicit safety overlay was independently traced in merged PR #53: `docs/workshop-brand.js:25` deliberately enforces an orange, noneditable workshop label in any URL containing `friendly123workshop` via MutationObserver, and disables joining real shops. The canonical stored name is distinct from the workshop header.

## Design / Ponytail full / Superpowers
- Preserve *all* production code and workshop brand guard. No change to Yjs, backend, PIN, price, stock, roles or script hashes.
- Existing VM tests in `i18n-header-nombre.test.js` already verify the real source of truth: a synchronized name is not overwritten by EN/ES switching in an unbranded DOM; no-name placeholder does translate; `data-i18n` removed for real names.
- The browser integration test uses `file://` from the workshop repo, deliberately activating `workshop-brand.js`. Its native assertion must distinguish *visible safety label* from synchronized name, instead of demanding the real name in the protected workshop. Keep `selectUbicacion` translated, prompt localized, `lang` and `f123_lang` invariant; assert orange badge stays pinned across both languages.
- Add WebKit alongside existing Chromium to run the same assertion in native engines. Use production network blocker and locked Playwright. No skips, no sleeps, no masking errors.
- RED proof is existing historical full audit 43965240844; GREEN must be a new exact-SHA CI. This change should be test+workflow+plan ONLY; after merged PR #53, never reintroduce the earlier incorrect UI fix.
- No production deployment or real licensed notebook interaction. Physical A→B→A ×2 remains a launch gate.
