# 2026-11-17 · Opus fixed gate B · Team readonly catalog with real central auth

Base workshop/main `2f663c052eb4c936ae11cb4dec62d2761dfd63a0` · [Notion scope reservation](https://app.notion.com/p/41b1642b67f381aaa3e3c37b1c00c5b2) · **NO PROD/FLAG**.

## Concrete disconnect in actual imported parts
Issuer `app/cloudflare-worker/ws-capability-issuer.mjs` already verifies Team member using HMAC credential and state revision, and grants `cat:read` only on explicit `WS_QA_ROLE_GRANTS`. Pilot `relay/injertos/yparty-worker/src/ws-authority-client.js` currently rejects every non-`dueno` role, even read-only Team. The Worker `Tienda.isReadOnly` accepts cat:read and denies mutation without cat:write. Opus demands Employee **never raw write** to `ops/-cat` and revocation, no new permissions.

## Minimal security contract
- Owner admission and private-scope policy unchanged.
- Team role `empleado` or `admin` permitted for *cat room only*, *cat:read only* (reject any extra scopes e.g. cat:write, ops:sale and room mismatch on admission). Avoid accidental Team raw Yjs modification through admin cat:write.
- Issuer remains authority: ticket issued by actual central Team PIN verifier, consumed once before socket upgrade, check on every broadcast with role revision and active flag.
- All Team access to ops/private, and any raw economic mutation, remains forbidden. No browser-provided role trusted.
- No new endpoint or data store; same Workerd/Service Binding and Yjs rooms.

## TDD
1. Extend existing **actual Workerd** `p0-secure-separate-rooms.test.mjs` with synthetic member record created via real `teamAuthority.update`, config allowed grants `empleado:cat:read`. Before implementation, Workerd must reject valid employee cat ticket: RED.
2. Once green, employee browser YProvider must join catalog and read Owner's product; attempted employee Yjs map mutation must not persist or broadcast; replay ticket fails.
3. Revocation via trusted authority revision must block new ticket/socket and keep existing recipient from receiving new catalog; verify no false sync.
4. Reject team ops/private and admin cat write even with issuer grant; fail closed. All existing Workerd tests pass.
5. Run integration 585/585 and verify CI SHA; update Notion/evidence. **No operational +4** until actual Team client UI/credential bootstrap works: gate B 16/20, 0/6 certified as before.

No edits `src/index.js`, `app/src/yparty-piloto.js`, `sync-yjs.js`, photo agent sources or production.
