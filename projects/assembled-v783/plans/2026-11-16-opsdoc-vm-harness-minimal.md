# P0 Yjs opsDoc VM false RED · lab-only test harness
2026-11-16. Base main 5cbd966d27e55de4559883a20e40163d96418a3b. Branch test/20261116-s1-opsdoc-fixture.

## Why this independent minimal fix
- Full historical audit 43944393991 test `S1 API.opsDoc: IndexedDB hydration never becomes a new durable relay op` failed `ReferenceError: canalesPiloto is not defined` in an extracted VM listener from `test/p0-s1-yjs-idb-replay.test.cjs`.
- Real `docs/sync-yjs.js` declares `var canalesPiloto` in outer function scope before the listener. The VM harness slices the listener without outer declaration; the product did not throw `ReferenceError`.
- PR #42 already demonstrated the one-line fixture correction in a separate branch (full 43960371230 omitted this particular failure), but PR #42 contains a perpetually red full-audit workflow that should not be installed broadly on production/repo main. Port only the tiny harness correction to main.

## Contract
1. Set `canalesPiloto: undefined` in `vm.runInNewContext` globals, documenting why. This matches real uninitialized `var`; no change to runtime code, origin guards or assertions.
2. Run original `test/p0-s1-yjs-idb-replay.test.cjs` with Node22. Validate both true historic IDB origins and without-IDB cases, no skips.
3. Merge only if exact SHA green. No new dependencies, network, user data or production changes. Then leave #42 draft as historical checkpoint or mark superseded (do not close without preserving its plan).
4. Explicitly preserve source hash and check that no runtime Yjs, photos or ops transport logic was changed.
