# vEXP001 Usability Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or equivalent TDD execution task-by-task.

**Goal:** Build a completely isolated experimental friendly-123 shell in `docs/exp001/` that lets JFC test the Paco/Luis usability fixes without touching the production workshop app or any customer data.

**Architecture:** One self-contained HTML5 shell with in-memory demo state and no network writes. It reproduces only the flows under test: Today, New Product, Move between shelves, Sell, Sales log/Undo, EN/ES toggle. A tiny `version.json` identifies shell `vEXP001`. Tests inspect the shell contract and copy rules.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Node test runner.

**Spec:** Notion page “friendly-123 — Paco + Luis usability pass: 7 fixes + regression locks (2026-10-02)”.

## Global Constraints

- Experimental only: no production/customer data, no sync, no licenses, no Worker calls.
- Shell id must be exactly `vEXP001`.
- English mode must contain no visible Spanish terms from the reported leak list.
- Required product code must be visible before Save.
- Move workflow must explicitly gate Item on From shelf.
- Demo red state must be labeled as sample/demo data.
- Product save confirmation appears only after in-memory persistence succeeds.
- Preserve regression behaviors: oversell block, $0 confirmation, 5-second undo, Today stats update.
- Keep implementation framework-free and reversible.

## Review Focus

- Empty shelf: Item must say there are no products, not appear broken.
- $0 product: cancel must not create product.
- Oversell: requested quantity above available stock must never decrement stock.
- Undo: after 5 seconds it becomes available and restores stock + Today metrics.
- Language toggle: every dynamic string must repaint, not only static labels.

---

### Task 1: Contract tests

**Files:**
- Create: `test/exp001-usability.test.js`

- [ ] Write tests asserting shell/version files exist and contain the approved UX contracts.
- [ ] Verify target shell is absent before implementation (RED condition).
- [ ] Commit tests.

### Task 2: vEXP001 shell

**Files:**
- Create: `docs/exp001/index.html`
- Create: `docs/exp001/version.json`

- [ ] Add visible `vEXP001` workshop badge and reset control.
- [ ] Implement Today demo framing.
- [ ] Implement New Product with visible required fields, $0 confirmation, post-save toast.
- [ ] Implement Move shelves sequence with disabled Item until source chosen.
- [ ] Implement bilingual copy without Spanish leaks in EN.
- [ ] Replace jargon with plain language; no `bc` button.
- [ ] Implement Sell, oversell guard, 5-second undo and Today stats.
- [ ] Commit implementation.

### Task 3: Verification

- [ ] Inspect changed files: only experimental shell, version, plan and test.
- [ ] Open live GitHub Pages route after merge.
- [ ] Exercise Paco/Luis flow manually in isolated shell.
- [ ] Record exact outcome and remaining gaps in Notion.