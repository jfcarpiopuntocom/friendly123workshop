# Relay revocation/awareness causal boundary — 2026-11-16
Branch: test/20261116-relay-revocation-barrier
Base main: a8b351ad2f97c0bbc3600357b618c1b4ef1d003c

## Problem and precise evidence
- Integrated Workerd+YServer suite run https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43960371269, job 133625837700: **26 pass, 1 fail**, test `revoked recipient gets no awareness frame when another socket closes`, actual 1 vs expected 0.
- The existing audited fake authority records an exact transaction sequence. Parsed the machine-readable `SYNTHETIC-FRAME-AUDIT` from the failed job: 14 issued tickets, exactly 1 frame flagged after revocation, **grantSeq=379, revokedSeq=380**, no frame with grantSeq>=revokedSeq. This is a frame authorized BEFORE revocation but received AFTER; test currently counts it as unauthorized, so this failure alone does not establish a post-revocation server authorization bypass.
- Previous security gates remain mandatory: a recipient must receive zero frames authorized after revocation; close code 1008; no new permission or real network.
- In `qa/p0-real-session-room.test.mjs`, this particular test waits for sender presence to appear but does **not** wait for a durable protocol barrier on receiver before attaching its listener. Adjacent expiry/revocation tests already use existing `durableBarrier(provider)` to drain pre-boundary traffic.

## Superpowers RED→GREEN + Ponytail minimal fix
1. Preserve exact failed run/trace (above): fixture RED, do not call product authorization leak without evidence.
2. Insert ONE `await durableBarrier(receiver.p);` after the presence-setup wait and before measuring post-revocation frames. Reuse existing helper, do not modify runtime YServer, authority, grants, assertions, closure code, or timeout.
3. Run exact native local Workerd test 5 consecutive fresh processes and then original paired authorization suite; archive complete outputs with SHA, require zero skips. Any failure means DO NOT declare corrected; analyze late-grant causal data, not arbitrary sleeps.
4. Keep strict expectation `binary===0` and close `1008`; if a frame has post-revocation grant, revert the harness-only hypothesis and fix actual shared send-boundary root cause in a separate runtime branch with explicit regression.
5. Before merging, reconcile with other PRs. No production deployment, customer room, license, or external authority.

## Contingency / next
If native test passes in isolation but fails combined with full suite, preserve that as ordering/race evidence and investigate worker lifecycle; never swallow errors. Return results and exact next action to Notion and GitHub for 5h-stop continuity.
