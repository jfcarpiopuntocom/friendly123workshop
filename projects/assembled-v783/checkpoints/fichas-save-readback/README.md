# WIP checkpoint — explicit failed-save result

Base runtime d132bf77c26a2b05e4cbdd523a5a93b0df1e206a (584/584 exact integrated CI43942634639). The adjacent candidate.patch preserves a followup before interruptible CI waits: return ok:false when guardarEstadoLocal does not confirm true, so the sync caller does not mark received signatures for a RAM-only merge. Same-record retry after storage recovery remains exactly once.

Apply only if not already integrated: git apply --check candidate.patch, then git apply candidate.patch from repository root. Three files: mock-backend.js, generated version-manifest.json and focused regression. Never reapply after the final followup commit.

RED factual failure: fichas-save-failure-red.txt (ok:true while disk refused). GREEN unit/stock29/29: fichas-save-failure-green.txt. Final native-browser31-case run pending at snapshot; future executor must read its own result. Exact d132 full CI43942634062 is still running. This patch is locally implemented but NOT yet the main runtime at this WIP checkpoint; it is preserved here to prevent loss during session stops. No production activation.
