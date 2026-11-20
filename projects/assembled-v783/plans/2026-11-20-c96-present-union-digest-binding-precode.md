# C96 PRECODE · C95 R2 seal must bind the actual accepted facts to the signed-by-caller union digest

2026-11-20 · Producto **jfcarpiopuntocom/friendly-123** master baseline `7d60ee99c65c553b6d494555bc49caeb334eaaf6`. Mismo producto 1.0→2.0; Sync3 intacto. C95 #897 recently MERGED. Sin historia antigua; jamás leer/escribir/borrar aparatos, ventas, IndexedDB, PIN, PWA o datos de Belén. QA sintética exclusivamente.

## Root cause seen in real source
`sealPresentUnionToR2` validates `sha256(unionPlan.manifestCanonical) === unionPlan.digest`, but `buildOpsStateFromUnion` serializes `unionPlan.facts[*].payload` independently. A shallow clone of an authentic unionPlan can replace its accepted fact payload or list while keeping `manifestCanonical`, `digest` and `authenticatedSealProof.unionDigest` unmodified. C95 may pack false cash/stock into immutable -ops and hand a misleading certified frozen source to Workerd. `authenticatedSealProof` is only the caller's assertion, not a server certificate.

## Scope and ownership
Own **only** `cloudflare-yparty-worker/src/current-state-union.mjs`, `cloudflare-yparty-worker/tools/seal-present-union-r2.mjs`, `cloudflare-yparty-worker/qa/p0-c95-seal-present-union-r2.test.mjs`. No overlap with open #888 catalog projection or any iPhone sync code, Cloudflare flags, C95 R2 storage, or 1.0 sources. Distinct C96 branch/PR, source no deploy.

## Acceptance RED→GREEN
1. RED real source test: replace `facts[0].payload.amountCents` via shallow copy while retaining authentic manifest+digest+proof; seal MUST refuse (currently accepts).
2. RED: replace/omit/add accepted fact or corrupt provenance `observedBy`/payloadHash without changing manifest; MUST refuse.
3. GREEN minimal export in C93 using its **existing** `canonical` and SHA functions: recompute each accepted payload SHA (domain separator `f123-current-fact-v1\\0`), reconstruct manifest from actual accepted facts and source summaries, compare byte-for-byte canonical text and SHA digest; enforce unique opIds/source count. C95 calls verifier before building any Yjs/R2 bytes. Do not invent canonicalization in second module.
4. Preserve authentic C93/C95 deterministic archive, R2 Workerd cold import, no leaked catalog secrets, conflict/quarantine refusal. No false ACK; no client claims.
5. Run focused C93+C95+R2 source QA in Actions after separate RED commit, then GREEN commit; inspect failures, merge by exact head SHA only when all required tests pass. Keep fixed scores 92.0/100 port, 80.4/100 quality until reviewed rubric supports update; GO0/6 physical0/5.

This is a data-integrity hardening of present-state sealing, not historical recovery or authorization to activate commercial cutover.