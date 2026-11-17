# Operational port completion /100, separate from architecture quality /100

2026-11-17. Source baseline friendly123workshop/main@2f44ff2a617d6cf6326292ef3565644479ed8219.
Notion reservation https://app.notion.com/p/41b1642b67f381cba1abc4a01aa65f6f.
No production edits, no customer data, no touches to reserved Worker/index.js or app/src/yparty-piloto.js.

## Immutable six first-shop GO gates (not more goals)

- Commercial operations 20 points: raw employee writes denied (4), server typed sale (5), adjustment (4), customer payment (4), opId business-committed ACK (3).
- Central Owner/Team and per-channel tickets 20: native issuer/service (5), Worker safe admission (5), browser ticket on every socket/reconnect (6), actual Owner/Team app actions (4).
- Photos outside Yjs 10: SHA blob persistent (3), only SHA metadata in Yjs (4), cross-device/recovery (3).
- Firebase↔DO import/rollback 25: complete frozen HEAD with zero pending(5), validated one-shot import Workerd(4), DO cold recover(3), full snapshot+journal export(3), Firebase encrypted reverse restore(6), actual certified cutover(4).
- Web Locks and iPhone resume 10: real Web Locks outbox(5), Safari pageshow persisted recovery path(3), physical iPhone resume(2).
- Two physical Opera PC↔Safari iPhone A→B→A cycles 15: first(7.5), second(7.5).

TOTAL 100. 100 means all the original six gates certified. Stage credits are partial, not an assertion of operational GO. Do not change weights to inflate progress or add WCAG/PWA/refactors.

## Baseline assessment grounded in existing tests

Initial pending before this task: econ 4/20, identity 10/20, photos 0/10, migration 10/25, outbox/iPhone 3/10, physical 0/15 = **27.0/100 PORT**, 0/6 independent commercial gate completions. The architecture score remains 64.5/100 and historical Nov10 45.0/100 retrospective.
Evidence: PR84 Workerd full export 4/4 and integration 585/585, PR83 importer 2/2, PR81 Safari BFCache 5/5; Worker has secure private admission and real issuer guards, but client does NOT use the authorized provider.

## Critical concrete mismatch blocking use now

Source app/src/yparty-piloto.js uses new YProvider(host,sala+'-'+tipo,doc) with static license/instance URL params. Source relay/injertos/yparty-worker/src/index.js in secureMode accepts only SALA_PILOTO+'-priv', requires cap one-use and central owner check and returns 503 when not configured. app/src/authorized-yprovider.mjs imports YProvider and refreshes cap per connection but is not wired in pilot. Existing client and Worker cannot establish the same secure room. Agents currently hold edit reservations on both files: ONLY create independent QA and Notion handoff to avoid collision.

## Test-driven implementation

1. This plan is committed first. Add score tests and mismatch contract probe before creating runtime scorer. GitHub RED feature absence -> GREEN.
2. New quality/port-v1.json, port.cjs, port.test.cjs and quality/PORT-STATUS.md; score calculated from fixed gate stages, immutable IDs and weights, exact SHA+CI evidence for checked stage, fail-safe GO if not all gates true and 100 points, report 2 separate metrics.
3. Contract probe only reads real workshop client/Worker source. It must report pilot=blocked until ticket/cap/priv room genuinely wired; do not let synthetic Workerd fixture pass this production client integration check.
4. CI on exact SHA; preserve Notion progress, PR and merge into workshop only, no false production claim.
5. Next engineer action: merge Workerd client ticket integration and server role policy from reserved branches, then certify migration real Firebase and physical cycles. Work with owners; no new gates.
