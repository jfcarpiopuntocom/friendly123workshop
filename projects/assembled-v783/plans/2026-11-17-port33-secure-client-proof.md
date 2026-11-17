# JFC two-score P0: recognize the real signed cat/ops client port (+6 identity), 17-Nov-2026

Base `44568d3036bb302e242200ecbc188615960a9bc3` from merged PR87, workshop-only. Notion reservation https://app.notion.com/p/41b1642b67f3818bb6cad84bc694e182.

Existing port index has exactly six JFC gates and **fixed** stages/weights. Earlier port 27.0 /100, quality 64.5 /100; six gates not certified. This is not another architecture change: integrate and **track** already verified operational source+vendor+Workerd wiring. Identity stage `browser-fresh-ticket` was fixed at 6 points before PR86/87 and is only stage to credit, yielding **33.0/100**. This does not certify Owner/Team roles nor any physical connection. Architecture quality unchanged. No new gates, no moving goalposts.

Evidence:
- [PR86](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/86) exact head `f01ef2f11fef1e6b83c955ac081db192b9f944cc`, native Workerd private signed cat/ops 4/4 [44150775169](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44150775169); full integrated 585/585 [44150993853](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44150993853).
- [PR87](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/87) exact head `1db297d2387d389b2b2b05e6191133c52b7b4ebd`, signed fresh client scope and actual rebuilt vendor source test 9/9 [44153648394](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44153648394), vendor SHA256 `19c19f71868eeac94adaf9f656877a484cbdb6c05e0a1ea79987e6a1d8c88a68`; final broad 585/585 [44153648286](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44153648286). Real browser + issuer protocol was previously tested on -priv; actual new cat/ops pilot compiled bundle is fixture/contract green, NOT physical Opera/Safari. Maintain that qualification.

## Precise RED→GREEN
1. Extend `qa/p0-port-client-worker-contract.test.cjs` with a fresh test that **must** recognize the current real source+worker as correctly wired (token callback, signed room suffix, 2 Y.Doc distinct), and guard against fabricated bare authority/three-Y.Docs-one-private/ops raw write. Existing inspector asserts blocked due to old assumption `-priv` only. Run CI RED before implementation.
2. Update `quality/port.cjs:inspectClientWire` tiny source-inspection to accept two isolated signed rooms while keeping safeguards. The old fixture with one `-priv` Y.Doc remains compatible as such, but *mixing three* into one room must remain incompatible.
3. Update port JSON exact stage `identity/browser-fresh-ticket` `done=true` with 2 code+CI evidence URLs at exact SHA, `pendingReason:null`. Do not certify the gate (Owner/Team role flows still incomplete). Do not credit another stage nor change weights.
4. Update `quality/port.test.cjs` current 33.0, identity 16/20, historical port 27.0 recorded, and `quality/PORT-STATUS.md` accurate next actions. Preserve quality 64.5. CI focal; full 585 prior exact SHA proof and any PR triggers.
5. PR workshop and permanent evidence/Notion. No production deployment, no flags, no real data. NO-GO 0/6.

Next actual priorities: typed server business commit; photo SHA outside Yjs; zero-pending real frozen Firebase import and encrypted rollback; Web Locks on outbox and iPhone physical A→B→A ×2.
