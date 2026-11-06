#!/usr/bin/env python3
"""Build self-contained Sync3 audit ZIP from immutable public Git SHA."""
import hashlib, json, pathlib, re, subprocess, zipfile
SHA="fa622f7f5e039e47d66a10b47dc723d495d6cc38"
BASE="b918eac359ee42c64190203423c460740377bc58"
R=pathlib.Path("/tmp/sync3-audit-repo")
O=pathlib.Path("audit-packets/sync3-pr589-v673/sync3-review-589-sha-fa622f7f.zip")
R.mkdir(parents=True, exist_ok=True)
def cmd(*a):
    return subprocess.check_output(["git","-C",str(R),*a],stderr=subprocess.PIPE)
subprocess.run(["git","-C",str(R),"init","-q"],check=True)
subprocess.run(["git","-C",str(R),"remote","add","origin","https://github.com/jfcarpiopuntocom/friendly-123.git"],check=True)
for rev in (SHA,BASE):
    subprocess.run(["git","-C",str(R),"fetch","-q","--depth=1","origin",rev],check=True)
assert cmd("rev-parse",SHA).decode().strip()==SHA
tracked=cmd("ls-tree","-r","--name-only",SHA).decode().splitlines()
changed=cmd("diff","--name-only",BASE,SHA).decode().splitlines()
assert len(changed)==15,changed
required={"README.md","package.json","package-lock.json","docs/index.html","docs/mock-backend.js","docs/dashboard.html","docs/sw.js","docs/version.json","docs/version-manifest.json","docs/manifest.json","docs/sync-rollout.json","docs/vendor/yjs-bundle.min.js","test/helpers/sin-red-produccion.cjs","docs/architecture/MDD-2026-10-31-localfirst-pin-ledger-sync.md"}
docs=re.compile("sync|relay|peer|ice|estado-idb|idb-fotos|photo|foto|device-identity|panel-pin|panel-licencias|licencia|version|sw[.]js|yjs",re.I)
tests=re.compile("sync|p2p|peer|relay|firebase|yjs|durable|outbox|fallback|photo|foto|head|causal|checkpoint|crash|persist|rescate|preack|stock|money|pin|inventory|comision|pwa",re.I)
flows=re.compile("sync|release|peer|p2p|s4|manifest|causal|pin|stock|inventory|yjs|photo|foto|preack",re.I)
keep=[]
for f in tracked:
    if f in required: keep.append(f)
    elif f.startswith("docs/") and f.endswith((".js",".json",".md",".html")) and docs.search(f): keep.append(f)
    elif f.startswith("test/") and (tests.search(f) or f.startswith("test/helpers/")) and f.endswith((".js",".cjs",".mjs",".json",".md")): keep.append(f)
    elif f.startswith(".github/workflows/") and flows.search(f) and f.endswith((".yml",".yaml")): keep.append(f)
    elif f.startswith("cloudflare-sync-relay/") and f.endswith((".js",".md",".toml")): keep.append(f)
    elif f.startswith("supabase-relay/") and f.endswith((".js",".mjs",".ts",".sql",".md",".json")): keep.append(f)
keep=sorted(set(keep+changed))
assert len(keep)>=290 and all(x in tracked for x in keep)
sources={p:cmd("show",SHA+":"+p) for p in keep}
notes="""# Claude Sonnet 5.5: Sync3 PR589 P0, Ponytail debugging only
Repository: https://github.com/jfcarpiopuntocom/friendly-123
PR: https://github.com/jfcarpiopuntocom/friendly-123/pull/589
HEAD: fa622f7f5e039e47d66a10b47dc723d495d6cc38
Base master v670: b918eac359ee42c64190203423c460740377bc58

CURRENT PR MICROFIX: slow RTC receiver no longer blocks initial delivery to healthy peers, deterministic head-of-line test RED->GREEN; full 3-browser CPU1 stress remains RED and P0 unresolved.\n\nMANDATE: ZERO UI/UX/copy changes. ZERO architecture, provider, spec or scope changes. No changes to business/financial/inventory/PIN/role semantics. TDD RED->GREEN from real cause; no removal of caps or arbitrary terminal caps that stop valid causal progress. Never touch production or client data without proved A->B->A x2 physical acceptance and all exact-SHA gates.

CONFIRMED: 8/8 three-browser Chromium direct P2P runs PASS on a 2-core sandbox, but running with taskset -c 0 REPRODUCES Timeout 12000ms at test/peer-sync-browser.test.js line 167. The two peer data channels were OPEN but edits remained unreceived and pending ACKs=2. At one failure: sender queued 12 live frames, bufferedBytes 584354 (queuedBytes 56390, one peer dc buffered 527964). Another failure: queued 7 live frames, bufferedBytes 1100696 (queuedBytes 56382, two DC buffers 528200 and 516114). Changing global SUM to MAX for per-peer DC buffers alone DID NOT solve the RED; do not apply that guess. Linux WebKit RTC preflight failed and test skipped; Safari not proven. Github Actions P2P A/B was intermittently red/green, current run 42141103284 green.

INSPECT: docs/peer-sync.js Socket.bufferedAmount, Hub.nudge, Socket.send serialized sends, Hub.deliver 5s buffer wait, peer receipts/retries. docs/sync-yjs.js enviarConLimite/encolarVivo/drenarVivo/programarBufferPump, durable ack and history replay; test/peer-sync-browser.test.js 3 peers and big photo. Distinguish congestion, stale DC bufferedAmount, live traffic HOL and durable ACK race. No green-by-timeout or reduced assertions.

Also retain Sync3: Yjs missing parents, finite HEAD pacing 4 pages/window and 8s for progress, Firebase same-ms 24 staged pages, durable cursor no rollback, do not checkpoint partial Y.Doc, PIN gate, 600 legacy envelopes. Review 11 changed files in PR_DIFF.patch; preserve independent exact SHA manifest.

Tests: npm ci; npx playwright install chromium webkit
node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=120000 test/peer-sync-browser.test.js
taskset -c 0 node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='direct chromium' test/peer-sync-browser.test.js
node --test test/sync3-head-causal-gap.test.cjs test/yjs-unresolved-checkpoint.test.js test/absorber-legacy-outbox.test.cjs

REQUIRE DELIVERABLE: proven single root cause, minimal patch, reproducible RED then stress GREEN, compatibility with v670/older clients, integrity of photos/ledger/money/PIN, release gate exact SHA, GO/NO-GO. No merger or production deployment without real PC/Safari/PWA license+PIN continuity A->B->A two cycles.
"""
notes += """\n\nCURRENT CUT fa622f7f: RED->GREEN for cascade buffer admission in docs/relay-selector.js: the previous H.bufferedAmount summed all open durable transport buffered bytes. A full preferred layer starved an empty fallback. Now H reports the least buffered OPEN layer and H.send independently enforces the existing 512KiB cap for EACH layer. Existing exceptional native encrypted checkpoint with empty buffer and daily quota remains intact. New 3 synthetic regression cases in test/relay-selector.test.cjs. 37/37 selector and 139/139 cross-domain targeted tests passed on repeated run. A one-off flake in 600-envelope evidence was observed in the first combined run but isolated and repeat tests passed; do NOT ignore full CI.
IMPORTANT: direct-only P2P remains intermittently RED under single-core load. A laboratory-only experiment changing Socket.bufferedAmount from SUM to MIN yielded 1/4 PASS in CPU1 trials (rejected, not shipped). Do not blame or adjust timeouts to hide the fault. A stale RTC data channel can stay open after pc.connectionState='disconnected' in an affected run; investigate real per-peer channel lifecycle, ACK, SCTP fragmentation and fair scheduling with deterministic RED before changing peer-sync.
Current PR #589 is DRAFT; master v670 untouched. Physical PC/Safari/PWA two A->B->A cycles with same synthetic shop remain required before GO.\n"""

evidence="""Synthetic isolated benchmark, commit fa622f7f:
- Chromium normal CPU: 8/8 runs passed.
- One core: intermittent RED with sender 2 unacknowledged durable envelopes and 7-12 live queue frames; 512KiB buffer pressure, RTC connections open, 12-second wait exceeded.
- Native WebKit RTC preflight did not open channel on Linux: SKIP, not Safari certificate.
- Changed MAX instead of SUM buffer experiment failed; NOT in candidate.
- GitHub run for P2P A/B: 42141103284, latest green after earlier red/green 42136366170.
"""
meta={"repo":"jfcarpiopuntocom/friendly-123","pr":589,"sha":SHA,"base_sha":BASE,"files":len(sources),"changed":changed,"provenance":"each source from git show SHA:path; no local modifications"}
O.parent.mkdir(parents=True,exist_ok=True)
prefix="SYNC3-PR589-review-fa622f7f/"
with zipfile.ZipFile(O,"w",zipfile.ZIP_DEFLATED,compresslevel=8) as z:
    for p,data in sources.items():z.writestr(prefix+"source/"+p,data)
    z.writestr(prefix+"PR_DIFF.patch",cmd("diff","--binary",BASE,SHA,"--",*changed))
    z.writestr(prefix+"CLAUDE_PONYTAIL_BRIEF.md",notes)
    z.writestr(prefix+"EVIDENCE_CPU1_RED.md",evidence)
    z.writestr(prefix+"HASHES_SHA256.txt","\n".join(hashlib.sha256(sources[p]).hexdigest()+"  "+p for p in sorted(sources))+"\n")
    z.writestr(prefix+"PACKAGE_METADATA.json",json.dumps(meta,ensure_ascii=False,indent=2))
print(json.dumps({"zip":str(O),"n":len(sources),"bytes":O.stat().st_size,"sha256":hashlib.sha256(O.read_bytes()).hexdigest()}))
