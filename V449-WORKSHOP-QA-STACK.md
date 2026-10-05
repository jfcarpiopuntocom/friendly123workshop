# v449 WORKSHOP — QA Safety Stack

**Scope:** experimental tooling only in `friendly123workshop`. This is **not** a public friendly-123 release and must not be promoted to the real repo automatically.

Canonical chain:

`Git worktree/branch → deterministic tests → Playwright/agent-browser → E2B only for risky execution → deploy only after gates → Langfuse for agentic traces`

## Rules

- v448 GOLDEN in the real friendly-123 repo remains untouched.
- No customer data is used as a fixture.
- Playwright is the deterministic browser gate.
- agent-browser is exploratory/visual verification, not the sole gate.
- E2B is opt-in and only runs remotely when `E2B_API_KEY` exists.
- Langfuse receives only synthetic test data until a privacy/redaction policy is explicitly approved.
- Missing E2B/Langfuse credentials produce a SKIP, not a false failure; package/API smoke still runs.
- Promotion from workshop to real repo requires a separate decision and review.

## Pinned tooling for this workshop experiment

- Playwright: existing repo dependency
- E2B: 2.52.0
- @langfuse/tracing: 5.11.1
- @langfuse/otel: 5.11.1
- @opentelemetry/sdk-trace-node: 2.11.0

## Smoke scripts

- `node scripts/qa-stack-smoke.mjs`
- `node scripts/e2b-smoke.mjs`
- `node scripts/langfuse-smoke.mjs`

The GitHub Actions workflow installs the experimental packages with `--no-save` so this laboratory does not silently alter the product dependency graph.
