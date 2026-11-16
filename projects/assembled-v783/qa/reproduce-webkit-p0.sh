#!/usr/bin/env bash
# Deterministic entry point for the two candidate-only WebKit failures.
# Run ONLY in the synthetic assembled-v783 laboratory; no production URL.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/app"
if [[ ! -f package-lock.json || ! -d node_modules ]]; then
  echo "Install pinned packages with npm ci in app/ before running" >&2
  exit 2
fi
if [[ ! -f test/helpers/sin-red-produccion.cjs ]]; then
  echo "Missing no-production-network guard; refusing to run" >&2
  exit 2
fi
mkdir -p ../evidence/webkit-p0
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
git rev-parse HEAD > "../evidence/webkit-p0/$stamp.sha"
set +e
node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=45000 \
  --test-name-pattern='direct webkit: durable business/photo recovery without central payload' \
  test/peer-sync-browser.test.js 2>&1 | tee "../evidence/webkit-p0/$stamp-peer.log"
peer_status=${PIPESTATUS[0]}
node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=45000 \
  --test-name-pattern='Fable P1-4 storage pressure on the old lease keys \(WebKit, lease\)' \
  test/tab-session-handoff.test.js 2>&1 | tee "../evidence/webkit-p0/$stamp-lease.log"
lease_status=${PIPESTATUS[0]}
set -e
printf 'SHA=%s peer_exit=%s lease_exit=%s\n' "$(cat "../evidence/webkit-p0/$stamp.sha")" "$peer_status" "$lease_status" | tee "../evidence/webkit-p0/$stamp-summary.txt"
if (( peer_status != 0 || lease_status != 0 )); then exit 1; fi
