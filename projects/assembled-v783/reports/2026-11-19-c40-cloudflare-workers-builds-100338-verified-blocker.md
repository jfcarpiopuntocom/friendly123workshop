# C40 final investigation: Workers Builds preview error 100338 (verified, no Cloudflare mutation)
Date 2026-11-19 Ecuador / 2026-11-20 UTC. Product friendly-123 master 8437839275b7f007cd05f5b3105887320edc95d9.
CURRENT OFFICIAL TRACKING: migration 86.0/100.0 quality76.4/100.0 GO0/6. Pending14.0. Same app 1.0→2.0, Sync3 retained.

## Main application PR ready but NOT merged
- PR https://github.com/jfcarpiopuntocom/friendly-123/pull/835 HEAD 955aadc13dc5fa7080e66fd349c5bab80dd25fd5; 48/48 GitHub Actions SUCCESS, branch code complete, no new DO/R2 customer deployment.
- C40 actual docs/sync-yjs.js adds API.obtenerReciboComercial20 + oc-op-20-recibo: actual sale opId maps into C15/C16a/C21a business committed DO receipt. New Workerd SQLite E2E test of exact source and bundle checks 1 receipt/1 stock/1 cash effect and no duplicate on replay, same opId. Shell v0.8.17 and SHA manifest.
- GitHub required check Workers Builds: friendly-123 FAILED. Check 135977365424, Cloudflare build adc579dc-ccf2-45a7-98d8-52480bee5a35. Merge denied HTTP 405 branch rule. No bypass.

## Exact Cloudflare REST log proof (read only)
- Worker friendly-123, script tag ca2cce34ba954725aa825e342ba93e29, account c4d8aa3b3e1db0d80b0beb4abc7c1364.
- For PR #835 original branch port2/20261119-c40-local-receipt-to-do-receipt-v817, Cloudflare Workers Build installs npm and runs npx wrangler preview (v4.151.1). Error code 100338: A preview with name 'port2/20261119-c40-local-receipt-to-do-receipt-v817' already exists. Preview ID 40265e95a9fd4fd984f69535d2fa8654 is auto_build true for that branch; deploy command npx wrangler preview.
- Distinct identical-code branch port2/20261119-c40-receipt-review-onepass, same exact HEAD 955aadc... PR https://github.com/jfcarpiopuntocom/friendly-123/pull/836, triggers a fresh Workers Builds check, which AGAIN fails 100338 due to pre-existing preview of new branch. Cloudflare build 444ecae8-286a-4266-8925-d6a6eb95cb30. Thus not branch name conflict but systemic auto-build preview lifecycle/CLI double-create. Closed #836 without merge; keep #835 canonical.
- Official Cloudflare docs https://developers.cloudflare.com/workers/previews/ say wrangler preview creates or updates existing preview, but current backend rejects it. Compare previous SUCCESS preview C39 build c92b24a6-2c28-46c1-80ff-9020074f89df.

## Safe release gates
- No direct Cloudflare API mutation, no preview deletion, no production deployment, no R2 writes, no customer activation, no branch-rule bypass. The extra GitHub branch did trigger Cloudflare's AUTOMATIC preview CI, which failed before publishing.
- Require authorized Cloudflare Workers Builds preview lifecycle fix; re-run required Workers Builds check on #835 until SUCCESS. Only then merge exact SHA and audit score separately.
- No score credit for unmerged C40; master still 86.0/76.4 GO0/6. After merge, a separate C41 score-only RED→GREEN may recognize up to 0.5 of current pending production-business-dispatch 2.0 and +0.2 architecture quality, only after exact source + real Workerd and proof, GO0/6.
- Original PRECODE: https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c40-cloudflare-preview-100338-review-branch-precode.md
