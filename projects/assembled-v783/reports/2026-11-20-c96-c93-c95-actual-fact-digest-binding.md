# C96 P0 C93/C95 accepted-facts integrity — real RED→GREEN, master and Cloudflare

20-Nov-2026 · same product `jfcarpiopuntocom/friendly-123`. Workshop evidence only; app functionality committed to product.

## Reproduction (REAL source, RED)
- PRECODE created before any edit: [C96 PRECODE](../plans/2026-11-20-c96-present-union-digest-binding-precode.md) workshop commit `fa6b4b88f4d51c8c198aab87fc36e4838ffdaf6e`.
- Real GitHub Actions [RED run 44814830935](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44814830935) on test-only SHA `7781bd988a69652a2f182226232162e7b7149961`, failure: `Missing expected rejection: changed economic cents must never be sealed using authentic digest`.
- Root: R2 C95 validated `sha256(manifestCanonical)===digest` but packed `unionPlan.facts` without hashing the ACTUAL fact values against C93 commitments; shallow mutable clone could switch cash, SKU, provenance or list and preserve digest/proof.
- Four tampering cases in RED test: money, provenance, deleted fact and payloadHash.

## Fix (GREEN)
- Product `cloudflare-yparty-worker/src/current-state-union.mjs`: export `verifyForwardCurrentUnionPlan()` using SAME C93 canonical() and domain-separated SHA of actual payloads, unique op IDs, sources/provenance and recomputed canonical manifest byte equality.
- Product `cloudflare-yparty-worker/tools/seal-present-union-r2.mjs`: call guard before any Yjs/R2 packaging.
- Product QA `cloudflare-yparty-worker/qa/p0-c95-seal-present-union-r2.test.mjs` retains original Workerd/Miniflare cold -ops/-cat import and adds four adversarial cases.
- [PR #898](https://github.com/jfcarpiopuntocom/friendly-123/pull/898) MERGED squash master `d52cf4ce5a03437d75b8191f55d494cdde42df7d`. Candidate GREEN SHA `5cf2a87b48984ba432c31163904474b5397e009c`, **13/13 GitHub Actions SUCCESS, zero failures**, including C93, C95, WebKit, Workerd, E1–E6, release-control and p0-hotfix.

## Actual Cloudflare readback
Authenticated Cloudflare GET production Worker `friendly-123` deployment **`9978286a-0ee4-47bb-bd0a-e9ea11caed6e`**, 100% to version `c4d9afd7-fb5e-42e9-af80-48e07f033954`; exact Worker Builds by version returned `690be9a2-5642-47b0-9b32-07d06bbc3283`, `stopped/success`, commit **`d52cf4ce5a03437d75b8191f55d494cdde42df7d`**. This confirms publication, not client 2.0 GO.

## Controls
No customer device or PWA, IndexedDB, PIN, live R2/Firebase, Cloudflare flags, service worker or Sync3 changed. No historical recovery. Static score fixed **transition 92.0/100, quality80.4/100**, GO0/6 physical0/5 until respective requirements satisfied. C96 protects integrity of the C95 offline packer and is not an owner-authenticated seal receipt by itself.
