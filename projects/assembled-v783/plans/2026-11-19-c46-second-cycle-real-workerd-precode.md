# C46 audit PRECODE — genuinely execute A→B→A twice

Product: jfcarpiopuntocom/friendly-123, PR #844, head 5c6d79b9ba41df2f71c1d55fdacedd497f35acef, base master 879954d5d63f54b55c5cd5e328319d4961fe9187.
Scope: ONLY cloudflare-yparty-worker/qa/p0-c46-cross-device-photo-and-downpath-workerd.test.mjs in existing C46 PR. Never alter Sync3, production source, real customers, Cloudflare deployments, or product score JSON.

## Root cause / RED hypothesis
The current test asserts A1→B1→A2 (one A→B→A cycle) while claiming A→B→A×2. The integrity invariant is not yet exercised across a *second* takeover: A1→B1→A2→B2→A3, including a failback between every Owner handoff. Five distinct commerce opIds against stock starting 5 must yield stock=0, cash=8000 (initial 500+five×1500), exactly five business effects and five receipts; retries of earlier opIds must not create a sixth. Distinct device IDB contexts preserved. This is Miniflare Workerd SQLite **synthetic QA only** and NOT PC/iPhone physical acceptance. The existing real photo Owner→Team readback must still pass.

## Ponytail fix
Add exactly B2 and A3 with same C21a activation/failback protocol under existing test, check both original and replayed receipts, update assertions (5/5). No other files. Execute existing C46 Workerd workflow and full CI on SHA exact. If a red test reveals runtime failure, leave branch red and report root cause, do not weaken assertions.

## Scoring discipline
Current master implementation 87.5/100 and architectural quality 77.0/100; no score points from a test-only PR until a separately justified fixed-budget audit of merged code. Commercial GO0/6, physical devices 0/5. Record GitHub/CI/Cloudflare evidence + Notion after result.
