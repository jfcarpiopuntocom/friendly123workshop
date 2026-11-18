# Opus Gates B/C: team photo SHA READ only with role/nonce/revocation, 17 Nov 2026

Base workshop main 9f535639561cb6013ce5981cbe39cf6fdde888df (PR92 merged), PR93 browser photo candidate still DRAFT. No production deploy, no flag toggle, no edits to any file reserved by the photo browser agent. Limit source to relay/injertos/yparty-worker/src/ws-authority-client.js and QA p0-secure-separate-rooms.test.mjs only.

## Original gate C/B blocker, not seventh gate
The central issuer already grants Team empleado/admin fotos:read, but Worker validatedAccess accepts only Owner or Team ops:sale. Legitimate Team photo GET returns 403. Signed Team photo PUT must remain 403, and Team never enters raw Yjs catalog, private, or economic rooms.

## RED first, then minimum GREEN
1. Existing real Workerd synthetic Team case: Owner uploads PNG bytes by SHA under fresh signed fotos:write; Team employee requests a new one-use fotos:read scope and does GET. Expect 200 and exact bytes (present server fails 403). Replayed Team photo cap must fail 403; Team read cap on PUT must fail 403.
2. Revoking Team membership centrally invalidates previously issued but unspent fotos:read ticket, subsequent ticket issuance fails. Other roles and Owner GET/PUT unchanged. Team photo ticket never opens any raw Yjs socket.
3. Minimal Worker validatedAccess union: Team admin/empleado subject checked, requiredScope===fotos:read, room suffix -fotos, principal scopes exactly [fotos:read], existing license/instance/room/signature/iAT/expiry checks untouched. No wildcard, no cookie, no cap URL.
4. Test actual Workerd CI RED then GREEN, browser+authority+score/port CI on final SHA. Document Notion and exact links; no merge, deploy or flag activation until QA verified.

## Accounting and rollback
Port 36.0/100 and GO 0/6 unchanged. Quality main 66.5 and PR93 combined 67.0 unchanged until integrated evidence. This adds a narrowly scoped read capability inside existing B/C, but does NOT certify the original C Yjs-only or physical stages. Rollback by abandoning this isolated branch; production and other agents' original branches remain intact.
