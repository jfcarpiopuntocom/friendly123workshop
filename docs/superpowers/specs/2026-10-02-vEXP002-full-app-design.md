# vEXP002 — Full friendly-123 Experimental Replica Design

Date: 2026-10-02  
Repo: `jfcarpiopuntocom/friendly123workshop`  
Branch: `exp/vEXP002-full-app`

## 1. Intent

Build **vEXP002** as a faithful, isolated experimental copy of the real current friendly-123 application, not as a reduced applet or mock.

The purpose is to test the Paco/Luis/Hugo usability fixes against the **real app architecture and flows** before porting anything back to production.

vEXP001 remains untouched as a disposable/salvageable experiment.

## 2. Canonical source

The source of truth for vEXP002 is:

- Repo: `jfcarpiopuntocom/friendly-123`
- Branch: `master`
- Commit: `dd3a0e1819be3b1bbdc88ed700f4f01606a0164a`

The workshop's existing `docs/` tree is **not** authoritative because it is materially behind/divergent.

### Baseline line counts + SHA-256

| File | Lines | SHA-256 |
|---|---:|---|
| `docs/index.html` | 10,379 | `5ed3ad267a7172a765ba49f32f4f17fe718ff39eeee5dbdab867da4526430841` |
| `docs/i18n.js` | 2,321 | `e38f8ebae20b53a8a815d8ed9334448b5aa0d495c7418dfed60bc98023d05ae8` |
| `docs/help-ui.js` | 498 | `0cd49726ca1e0544ceb7a0147d110c3c57dd849200eb0582ddf9f2f10bdaabec` |
| `docs/mock-backend.js` | 5,988 | `fd8ca8a5e6ce2cf30d23ff9cb20c2383e9a63d59e3f34ff42f6dc239f69d5544` |
| `docs/auth-ui.js` | 2,060 | `75e665bbfbb544aeeb6d629916b647eccb4552d00533555a6598b7a9df7bb790` |

The workshop comparison already showed:

- friendly-123 `docs/`: 158 blobs
- workshop `docs/`: 99 blobs
- 63 source files missing from workshop
- 38 common files changed/diverged

Therefore vEXP002 must not be built by patching the old workshop shell.

## 3. Architecture

Create an isolated subtree:

```
docs/exp002/
  index.html
  ...runtime dependencies copied from canonical friendly-123...
  version.json
  BASELINE.json
  COVERAGE.md
```

The vEXP002 runtime should preserve the canonical relative-path structure so that copied modules behave exactly as they do in friendly-123.

No existing production-facing workshop file should be repurposed as the vEXP002 runtime.

## 4. Isolation rules

vEXP002 is an experimental proving ground.

It must not:

- touch the production `friendly-123` repo;
- write to customer production data;
- point to production licensing state;
- push changes to `estable`, `next`, or `previo`;
- alter the workshop's existing EXP001;
- silently share mutable storage namespaces with other workshop builds.

Where the real app uses localStorage / IndexedDB, vEXP002 must use an explicit experimental namespace or other isolation mechanism so testing cannot contaminate another build's browser state.

## 5. Fidelity rules

vEXP002 should retain the real application rather than simplify it.

Specifically preserve:

- real auth/PIN UX;
- role chip and named-user chip;
- inactivity timeout;
- Forgot/recovery behavior as appropriate for workshop-safe execution;
- real inventory views;
- real product create/edit flows;
- real shelves / branches;
- real customers;
- real debt/credit UI;
- real commissions UI;
- real Today dashboard;
- real selling flow;
- oversell block;
- $0 product confirmation;
- 5-second undo behavior;
- real offline/local durability behaviors where safe to exercise in the workshop;
- existing accessibility and mobile behaviors.

The design goal is: **same app, isolated data, targeted fixes.**

## 6. Confirmed Paco/Luis usability fixes

### 6.1 Required product code visible before Save

Current real app validates after submit via `form.codeRequired`.

Change the product form label itself so the requirement is visible before interaction:

- EN: `Barcode / internal code (required)`
- ES: equivalent simplified Spanish.

Keep existing validation.

### 6.2 Move between shelves sequencing

Current real app initially shows a blank Item select.

Change behavior:

1. `From shelf`
2. `Item`
3. `To shelf`

Before choosing source:

- Item disabled
- placeholder: `Choose a shelf first.`

After choosing source:

- populate items
- if source is empty: `No products on this shelf.`

Do not change transfer business logic.

### 6.3 English-language purity

Known real-source leaks include:

- `On account (fiado)`
- `Record debt (fiado)`
- `Record credit (abono)`
- `Commission agent (comisionista)`
- `— Sin sucursal —`
- `— Ninguno —`

The fix must target **visible UI copy only**.

Do not rename internal model fields such as `comisionistaId`, `formaPago: "fiado"`, or other persisted/internal identifiers.

### 6.4 Remove internal jargon

Known examples:

- `the rack's deal`
- unexplained `bc` if it can be reproduced
- `Bar (count by serving)` should be rewritten in clearer owner language without changing the product-type semantics.

Any ambiguous term must be traced to its actual function before being renamed.

### 6.5 Demo emergency framing

The real Today copy currently includes:

`You need to act today — there are emergencies in your business.`

For demo/sample data, add explicit context that the alert belongs to the sample business.

Do not weaken or falsify real alert severity.

The production semantics remain red; only demo context is clarified.

### 6.6 Product save confirmation

Current real product flow returns from successful POST and calls `pintarFicha(data)` with no explicit saved confirmation.

Add a short success message only **after** successful POST.

Required semantic:

`Product saved.`

Do not display before the real save succeeds.

### 6.7 Category example

Replace narrow placeholder:

`e.g. Spirits`

with a broader example such as:

`e.g. Coffee, Art prints, Accessories`

### 6.8 Preserve single product form safety

The real app already contains explicit defenses around duplicated `np-*` IDs and `ocLimpiarOtroFormProducto()`.

Do not remove or bypass these protections.

Add regression coverage ensuring only one active product form exists at a time.

## 7. Positive behaviors that must not regress

Treat these as contract tests:

1. Oversell attempt (e.g. 9999 when stock is 200) is rejected without changing stock.
2. Product price $0 still requires explicit confirmation.
3. Sale undo remains guarded by its 5-second window.
4. Add product → sell → Today updates sale count and average correctly.
5. Existing product-form duplicate-ID protection still works.
6. Existing role gating remains intact.
7. Existing client/debt/accounting logic is untouched unless directly required by a confirmed UI copy fix.

## 8. Additional stress-test items

These can be incorporated only when they naturally belong to the real app and can be validated honestly:

- duplicate product code rejection;
- rapid double-submit guard;
- courtesy-sale confirmation;
- debt requiring a named customer;
- delete product confirmation;
- product draft survival after refresh;
- customer name validation;
- expense amount validation;
- safe escaping of HTML-like product names;
- product search.

If a behavior already exists in the real app, preserve/test it rather than replacing it.

If it does not exist, do not add it merely because EXP001 had it; inspect the canonical app first.

## 9. Files likely to change inside vEXP002

The expected targeted change set inside the isolated replica is small relative to the copied runtime:

- `docs/exp002/index.html`
- `docs/exp002/i18n.js`
- `docs/exp002/help-ui.js` only if a confirmed visible leak lives there
- `docs/exp002/mock-backend.js` only if a regression test proves backend validation is needed
- tests for vEXP002
- `docs/exp002/version.json`
- `docs/exp002/BASELINE.json`
- `docs/exp002/COVERAGE.md`

The source-copy step itself will create many files under `docs/exp002/`, but feature edits should remain narrowly scoped.

## 10. Baseline manifest

`BASELINE.json` must record at minimum:

- canonical source repo;
- canonical source commit;
- source line counts for key files;
- source SHA-256 for key files;
- copy timestamp;
- EXP002 revision;
- list of intentional edits after copy.

At completion, produce a second checksum table for the edited vEXP002 files.

## 11. Test strategy

Use strict TDD for changes after the canonical copy is established.

### Static/source contract tests

- required label visible;
- Move Item disabled before From shelf;
- no known Spanish leaks in EN UI strings;
- no `the rack's deal`;
- broad category placeholder;
- demo framing exists;
- save success message only appears in the successful branch;
- duplicate-form safety retained.

### Functional browser tests

Using workshop-safe demo data:

1. Enter demo PIN.
2. Verify active role chip.
3. New Product shows required code before Save.
4. Missing code still blocks.
5. $0 still prompts.
6. Successful create yields `Product saved.`
7. Move shelves initially guides the sequence.
8. Empty source shelf explains itself.
9. Oversell remains blocked.
10. Normal sale updates Today.
11. Undo remains 5 seconds.
12. English mode contains none of the reported Spanish leaks.
13. Demo red banner is contextualized as sample data.
14. Mobile-width smoke.
15. Offline/local-storage smoke if the copied runtime supports it safely.

## 12. Publication strategy

vEXP002 should publish only to the workshop domain/path.

Target route:

`/exp002/`

It must not replace:

- workshop root;
- EXP001;
- any production friendly-123 route.

## 13. Salvage policy for EXP001

EXP001 stays intact.

Nothing is ported automatically.

A visual/copy/interaction from EXP001 may be reused only when:

1. it clearly solves an approved issue;
2. it fits the canonical real app;
3. it passes the real app's regression tests.

## 14. Success criteria

vEXP002 is successful when:

- it visibly and functionally feels like the current real friendly-123 app;
- the Paco/Luis confirmed issues are fixed in-place;
- positive behaviors remain intact;
- experimental storage/data cannot contaminate production or other builds;
- line counts/checksums prove what was copied and what changed;
- EXP001 remains available for comparison;
- the user can evaluate vEXP002 before any production port.

## 15. Explicit non-goals

- no redesign of the whole product;
- no replacement framework;
- no new standalone applet;
- no production deploy;
- no broad refactor;
- no renaming persisted/internal domain identifiers solely for English polish;
- no silent migration of customer data.

## 16. Decision

Proceed with **Approach B: full isolated replica of canonical friendly-123 in `docs/exp002/`, then targeted micro-surgery.**
