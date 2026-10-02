# vEXP001 — Stress-test coverage matrix

Source: Notion page **friendly-123 — Stress test de UI (Paco, Luis, Hugo)**, 2026-10-02.

Scope: isolated workshop shell only. No production friendly-123 files, customer data, sync, licensing, Workers or service worker behavior are touched.

## Confirmed findings

| # | Finding | vEXP001 coverage |
|---|---|---|
| 1 | Required code warned too late | **Covered.** “Barcode / internal code (required)” is visible before Save; missing code still focuses the field and shows a clear error. |
| 2 | Move shelves Item appears empty | **Covered.** Item starts disabled with “Choose a shelf first.” After source shelf, items populate; an empty shelf says “No products on this shelf.” |
| 3 | Spanish leaks in English | **Covered in workshop UI.** English mode uses debt, credit-style plain language, Partner shelf, No/None-free explicit copy; blacklist regression test includes fiado, abono, comisionista, Sin sucursal, Ninguno, SUCURSAL. |
| 4 | Jargon: rack deal, house people, consignment, Bar serving, bc | **Covered.** No bc control; no “the rack's deal”; no “house people”; no “Bar (count by serving)”; “Consignment” is replaced by **Partner shelf**; commission hint says “Leave blank to use shelf commission.” |
| 5 | Demo red banner feels like real emergency | **Covered.** Persistent DEMO DATA banner says alerts belong to the sample business; title says “Sample business needs attention today.” |
| 6 | No product-saved confirmation | **Covered.** “Product saved.” appears only after in-memory creation succeeds. |
| 7 | Product form possibly duplicated in DOM | **Covered by construction + test.** Exactly one element has id product-form. |
| 8 | Ambiguous insight/badge copy | **Covered.** Precise phrases: High margin · strong unit economics; Low stock · review replenishment; Expired sample · remove from sale. |
| 9 | Irrelevant category example “Spirits” | **Covered.** Category example is “Coffee, Art prints, Accessories.” |
| 10 | PIN unclear / no submit affordance | **Covered.** Gate says “Enter a 3-digit demo PIN,” has an Enter button, supports Enter key, and displays demo PIN roles. |
| 11 | Active role not visible | **Covered.** Header persists “Active role: …” after entry. |

## Positive behaviors preserved as regression locks

- Oversell: Try 9999 can never decrement stock; message includes available quantity.
- $0 price: explicit confirmation before creating the product.
- Undo: new sale waits 5 seconds before Undo becomes active.
- Add product → sell → Today: product count, sales count, revenue and average update.
- HTML-like product names are escaped before rendering.

## Additional stress-test safeguards implemented

| Idea from stress test | vEXP001 handling |
|---|---|
| Courtesy sale could give stock away by mistake | **Covered.** Explicit confirmation: “Courtesy sale: revenue will be $0. This still reduces stock.” |
| Debt could be recorded casually | **Covered conservatively.** Debt requires a named customer; workshop explicitly says it does not invent a credit limit. |
| Duplicate code | **Covered.** Case-insensitive duplicate code is rejected before creation. |
| Rapid double/triple sale confirmation | **Covered.** saleBusy + button disable guard around sale mutation. |
| Back/refresh mid-product form | **Partially covered intentionally.** Product draft is stored in sessionStorage and restored after refresh in the same tab. Browser-history semantics of production modals are not simulated. |
| Delete product + confirmation | **Covered.** Workshop product cards expose Delete product with native confirmation. |
| Customer empty name | **Covered.** Required name; max length 80; emoji is allowed as text. |
| Expense 0 / negative / 12.345 | **Covered.** Amount must be >0 and have at most two decimals. |
| Product long/HTML-ish text | **Covered.** maxlength constraints + escapeHtml for rendered product content. |
| Product list difficult with many items | **Covered.** Search by name, code or category. |
| Small-screen sidebar crowding | **Covered in workshop layout.** Nav becomes horizontally scrollable below 860px. |

## Deliberately NOT simulated in vEXP001

These are real production-system concerns and should not be “proven” by a disconnected workshop shell:

- production inactivity timeout;
- production FORGOT? recovery;
- full Advanced tab;
- production service worker / offline persistence;
- real sync / license / device identity;
- production browser Back/Forward behavior for every existing modal;
- bulk edit/export/keyboard-shortcut power-user roadmap.

Those require tests against the real /next/ shell, not a mock workshop. The workshop exists to validate copy, affordances, form sequencing, and safety interactions before porting them.

## Exit gate before porting anything to friendly-123

1. Open the published vEXP001 URL.
2. Run Paco path: PIN → New product → Move → Sell → Today.
3. Run Luis path: empty save → missing code → $0 → 9999 → courtesy → debt with Walk-in.
4. Run Hugo path: duplicate code, HTML-like name, rapid Record sale clicks, expense 0/-1/12.345, refresh during product draft, language toggle across 3 screens.
5. Mobile width smoke.
6. Only then create a separate implementation plan for the production /next/ app.

The workshop is a proving ground, not evidence that the production app is already fixed.
