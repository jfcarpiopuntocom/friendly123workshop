# P0 Opus E (fixed 5-point stage): Web Locks outbox atomic no-lock fallback · 17-Nov 2026

Isolated QA branch off PR93 exact 048b3d2c6f9bb6bd2abc0e5162a6f291448c855c (all 14 workflows GREEN). Photo owner still reserves app/docs/sync-yjs.js on its own branch feat/20261117-photo-sha-browser; DO NOT update/force their original branch or workshop main. This is a separate controlled QA experiment; no merge before coordination and no production deploy.

## Defect to close, not new gate
In real source sync-yjs.js mutarOutbox(change), the missing navigator.locks path calls run() unguarded. The saved outbox is a multi-key IDB v2 list; two browsing contexts can both read old revision and later overwrite each other's independent opIds, or resurrect an ACKed op. Old PR90 behavioral test only checks a regex for this branch; amend to prove genuine 2-tab no-lock behavior.

## First tests RED on actual source and fake-indexeddb
1. Import PR90 source-extract test as QA-only snapshot on this separate branch. Add two VM tabs using shared real fake-indexeddb DB with no navigator.locks. Queue op-A / op-B concurrently, then third tab cold reads BOTH and metadata rev; no lost op, no false ACK.
2. Race an ACK of A against append C; B and C must survive, A never resurrects; restart reload preserves result. Simulate closed DB/failed commit: MUST reject, zero durable success callback and in-memory _unsaved retained.
3. When no Web Locks, use a single native IDB readwrite transaction containing ALL read/modify/write of v2 outbox and metadata, serializing writers across tabs. Do not split read and write across awaits; preserve old Web Locks path untouched, keep synchronous `change` and opId dedup. Do not fall back to unsafe localStorage if atomic DB unavailable. Emit a visible event in no-lock mode so users know fallback is active; do not expose sensitive ops in event.
4. Honor no-licence leak, no ACK before transaction commit, preserve opId. Never claim physical iPhone proof. Leave previous photo/SHA vendor source intact in this isolated branch except exact focused patch to mutarOutbox; output test log and review diff.

## Score and integration constraints
Port 36/100 (A4 B16 C3 D10 E3 F0), quality 67/100 PR93, 0/6 GO. Gate E stage idb-outbox-web-locks has 5 POINTS FROZEN. Award +5 (port 41/100) **only** if both Web Locks and no-lock tests pass with actual code + integrated browser/WebKit and reviewed CI evidence, and when the integrated code is carried forward to the single-owner branch/main. Do not award points for standalone test alone. Physical E final +2 remains separate.

Rollback: discard branch, PR93/source photo branch remain untouched, workshop main@9f53563 and production@45757cac unchanged.
