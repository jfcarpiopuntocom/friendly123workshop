# P0 Port usable: secure client gets unique cat / ops tickets from session PIN (17-Nov-2026)

Base = PR86 Workerd secure-room source SHA `f01ef2f11fef1e6b83c955ac081db192b9f944cc`. Workshop-only reservation https://app.notion.com/p/41b1642b67f381539768c6a20fe91dc0. Other QA repo files and production untouched.

## Existing imported parts; no new framework
- Existing `app/src/authorized-yprovider.mjs` already enforces asynchronous fresh `params()` before every WebSocket incl reconnect, never reuses stale cap.
- Existing `app/src/ws-owner-ticket-params.mjs` already requests fresh tokens from existing HMAC issuer with live credentials, but currently restricts rooms to `-priv`.
- Existing client `app/src/yparty-piloto.js` uses bare `new YProvider` static `{licencia,instancia}`; must reject that insecure admission. Existing secure Workerd PR86 will only permit `cat` and `ops` with centrally verified `cap`, while raw ops are readonly.
- Existing browser `window.OCSecure.leerPinQueAbre().owner` supplies volatile Owner PIN (same source as imported `team-authority-client.js`), do not store it in a new global, URL, DB or logs.
- In `fotos`, the authorized Worker intentionally does not accept raw bytes until external SHA photo store exists; keep legacy encrypted relay. **Never conflate fotos/cat/ops Y.Doc in one private room.**

## Tests before source (Superpowers RED-GREEN)
1. Test exact real `ws-owner-ticket-params.mjs` with local synthetic fake issuer; `-cat` issues precisely [cat:read,cat:write], `-ops` issues [ops:read,ops:sale], `-priv` unchanged; invalid `-fotos` rejected, role/PIN/room changed rejects, issuer errors fail closed. Token minted each attempt and never cached.
2. Source-level VM compiled pilot with stub AuthorizedYProvider: invoke `canal(...).conectar()`, mock `window.OCSecure.leerPinQueAbre().owner`, source actual `f123_owned`, expect one `AuthorizedYProvider` constructed for cat/ops and `params:async()=>...`, no static bare license+instance; no credentials on legacy photos; missing PIN/session -> fallback no socket; hidden page -> skip.
3. Green minimal source imports existing AuthorizedYProvider + createOwnerTicketParams, uses callback reading PIN every attempt and checks current owner/instance; no construction if no access; encrypted legacy fallback unchanged. Render no UI changes. Preserve `certificar` and all durability guards; do not change new worker auth.
4. CI native browser and Workerd tests on exact SHA, then generated vendor bundle via esbuild pinned lock, verified executable with Playwright/WebKit before considering stage completion. No manual patch of minified bundle. Until vendor built, stage "browser-fresh-ticket" stays false and PORT 27.0.
5. Integration tests 585 and merged PR86 prior to client PR merge, validate core real browser IDB and fresh ticket reconnection; keep no deploy unless all six JFC gates green.

## Scope
Only two workshop source files, new QA workflow/test/plan; no F123 production service or real PIN/client data. NOT changing `friendly-123-injertos`, keeping separate ownership. If changes cannot be certified due to build, leave PR draft with exact failures and no claimed port score.
