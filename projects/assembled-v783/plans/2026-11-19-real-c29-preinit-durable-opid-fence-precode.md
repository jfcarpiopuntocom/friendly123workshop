# C29 PRECODE — C27 cold Safari opId fence before coordinator exists (19-Nov-2026)

Target: *same product* `jfcarpiopuntocom/friendly-123`, master@d8b73722d21a4620900cd012abc9b8d2c59911a4; v0.8.11 C27 already merged. Sync3 is 2.0. Workshop solely audit. Antigravity owns C28 new-only QA (Workerd bundled 2 devices); DO NOT edit their two files. No Cloudflare/R2, budget USD 0.00.

## P0 window (from source)
`docs/sync-yjs.js`: C27 `publicarOpLocal` checks `API.coordinadorCorte20?.canDispatchOnLegacy` only if an explicit coordinator has already been instantiated. Before explicit C25 factory is called again after Safari reload, `API.coordinadorCorte20=null` and old `API.opsMap.set(opId,op)` runs synchronously. But C21b committed marker remains safely in existing IDB `settled_ops`, and the 2.0 DO can have applied this very opId: cross-ledger duplicate potential. Test C27 cloned facade rather than extracting/evaluating the exact source function, so missed preinit.

## Complete Ponytail change
Guard only QA pilot with `piloto` loaded and `API.crearAlmacenDurableOpsTipadas` present. Make `API.puedeDespacharOpEnLegado` consult C21b durable pending and committed opIds even when coordinator null. `publicarOpLocal` uses that shared guard in pilot-mode, never a synchronous unguarded legacy insert. Fail CLOSED if namespace/IDB inaccessible. Preserve legacy synchronous path when QA pilot absent. Verify the exact source `publicarOpLocal` function by extraction into Node vm (no manual facade copy), with fake-indexeddb and a terminal committed marker; after reload with coordinator null no legacy write; unknown opId allowed; corrupted/blocked store denies; after coordinator active still works. Bundle unchanged because pilot API already exists; docs/sync-yjs.js modification is part of SHELL, requires exact v812, golden348 and regenerated manifest. 
Instrument test with no-production-network harness, source contract and preinit runtime.
All checks exact SHA, TDD RED→GREEN, no redefinitions outside branch. Measurements: current PORT 83.5 and quality 75.6; do not claim more without scored evidence. QA/cloud flags remain OFF and physical GO 0/6.

Potential caveat: a multi-tab race between check and adding legacy op remains separate and requires an atomic dual-engine authority boundary; this patch closes *preinitialization* gap, not every global interprocess race. 
