# E4 current strict post-ACK drain boundaries — no runtime edits
Date 2026-11-16. Branch test/20261116-e4-drain-boundary-count based on main 2f6cfd4a26eb361dc916aec21e4a5871f746dd3e.

## Root-cause evidence
Historical full [43965240844](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43965240844) test `E4: Yjs authoritative owner name converges on equal revision despite local future clock` fails only at **static trusted-drain count** in `test/stable-review-integrity.test.js:70`: expected 9, actual 12. Earlier dynamic assertions in same test passed: store-name precedence; actual Yjs marker, drain role/context, queues and no prematurely dropped fact. The 9-count comment explicitly dates to v688 Add Customer, whereas current runtime adds more strict post-ACK boundaries.

## Proof of exactly 12 existing callers (do not fabricate)
Read entire `app/docs/mock-backend.js` from main and enumerated twelve literal `_drenarCatalogosPendientes();` calls. In file order:
1 payout finally
2 barcode/conversion finally
3 sale finally
4 return/devolution finally
5 retention/cancellation finally
6 retention/credit-related finally
7 stock delta finally
8 import finally
9 retention config finally
10 bulk cash/retention finally
11 customer Add finally
12 customer contact finally
All immediately follow guarded completion/rollback inside finally, *not* unguarded disclosure of provisional business state. Counting only 9 became a false static RED after code growth.

## Minimal and tested plan
Update count to 12 and comment enumerate the current verified boundaries; DO NOT replace with `>=9`, suppress assertion, touch business runtime or Yjs transport. Execute whole original `test/stable-review-integrity.test.js` with Node22 locked dependencies and production-network block, no skips. If another test fails, investigate and keep draft RED. After green, workshop-only merge exact SHA, no customer deployment. Parallel PR #52 changes rack toggle endpoint in same backend: recheck total before merge; if main changes caller count, reconcile and rerun.
