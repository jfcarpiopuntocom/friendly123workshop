// Post-C224 Bloque I (G01-G06) + Bloque II (G07-G09) surgical enhancers and red->green helpers.
// Built in friendly123workshop so Codex can apply them in its exact chosen sequence
// (1: C224 v0.9.02 -> 2: G01-G06 -> 3: G07-G09) with zero friction.

export function applyBloque1G01ToG06CfRelay(cfRelaySource) {
  let s = cfRelaySource;

  // G04: 429 Retry-After + jitter backoff helper & G05: BroadcastChannel multi-tab session cache
  const targetSessionCache = '    var sessions = Object.create(null); // in-memory ONLY, never localStorage\n    var sessionInFlight = Object.create(null);';
  const replacementSessionCache =
    '    var sessions = Object.create(null); // in-memory ONLY, never localStorage\n' +
    '    var sessionInFlight = Object.create(null);\n' +
    '    var ratePauseUntil = Object.create(null);\n' +
    '    var sessionBc = null;\n' +
    '    try {\n' +
    '      if (typeof BroadcastChannel === "function") {\n' +
    '        sessionBc = new BroadcastChannel("f123-cf-sess-v1");\n' +
    '        sessionBc.onmessage = function (ev) {\n' +
    '          var d = ev && ev.data;\n' +
    '          if (!d || typeof d !== "object") return;\n' +
    '          if (d.k === "clear") { sessions = Object.create(null); return; }\n' +
    '          if (d.k === "sess" && typeof d.room === "string" && typeof d.token === "string" && Number(d.expiresAt) > Date.now()) {\n' +
    '            sessions[d.room] = { token: d.token, expiresAt: Number(d.expiresAt) };\n' +
    '          }\n' +
    '        };\n' +
    '      }\n' +
    '    } catch (_) {}';
  if (!s.includes(targetSessionCache)) throw new Error('Missing targetSessionCache in cf-relay.js');
  s = s.replace(targetSessionCache, replacementSessionCache);

  // G05: broadcast clear on logout
  const targetClear = '    function clearSessions() {\n      sessions = Object.create(null);\n      sessionInFlight = Object.create(null);\n    }';
  const replacementClear =
    '    function clearSessions() {\n' +
    '      sessions = Object.create(null);\n' +
    '      sessionInFlight = Object.create(null);\n' +
    '      try { if (sessionBc) sessionBc.postMessage({ k: "clear" }); } catch (_) {}\n' +
    '    }';
  if (!s.includes(targetClear)) throw new Error('Missing targetClear in cf-relay.js');
  s = s.replace(targetClear, replacementClear);

  // G04 + G05 inside ensureSession
  const targetEnsure =
    '    async function ensureSession(room, forceRefresh) {\n' +
    '      var cur = sessions[room];\n' +
    '      var now = Date.now();\n' +
    '      if (!forceRefresh && cur && cur.token && cur.expiresAt - now > SESSION_REFRESH_MARGIN_MS) {\n' +
    '        return cur.token;\n' +
    '      }';
  const replacementEnsure =
    '    async function ensureSession(room, forceRefresh) {\n' +
    '      var now = Date.now();\n' +
    '      if ((ratePauseUntil[room] || 0) > now) {\n' +
    '        var rlErr = new Error("Cloudflare relay rate-limited backoff");\n' +
    '        rlErr.status = 429;\n' +
    '        throw rlErr;\n' +
    '      }\n' +
    '      var cur = sessions[room];\n' +
    '      if (!forceRefresh && cur && cur.token && cur.expiresAt - now > SESSION_REFRESH_MARGIN_MS) {\n' +
    '        return cur.token;\n' +
    '      }';
  if (!s.includes(targetEnsure)) throw new Error('Missing targetEnsure in cf-relay.js');
  s = s.replace(targetEnsure, replacementEnsure);

  const targetSaveSess =
    '        sessions[room] = {\n' +
    '          token: sessBody.token,\n' +
    '          expiresAt: Number(sessBody.expiresAt) || (Date.now() + 9 * 60 * 1000)\n' +
    '        };\n' +
    '        return sessions[room].token;';
  const replacementSaveSess =
    '        sessions[room] = {\n' +
    '          token: sessBody.token,\n' +
    '          expiresAt: Number(sessBody.expiresAt) || (Date.now() + 9 * 60 * 1000)\n' +
    '        };\n' +
    '        try { if (sessionBc) sessionBc.postMessage({ k: "sess", room: room, token: sessions[room].token, expiresAt: sessions[room].expiresAt }); } catch (_) {}\n' +
    '        return sessions[room].token;';
  if (!s.includes(targetSaveSess)) throw new Error('Missing targetSaveSess in cf-relay.js');
  s = s.replace(targetSaveSess, replacementSaveSess);

  // G04: record 429 Retry-After + jitter on ticket or session 429
  const targetSessReject =
    '        if (!sessRes.ok || !sessBody || sessBody.ok !== true || typeof sessBody.token !== "string") {\n' +
    '          var sErr = new Error("Session exchange rejected");\n' +
    '          sErr.status = sessRes.status || 403;\n' +
    '          throw sErr;\n' +
    '        }';
  const replacementSessReject =
    '        if (!sessRes.ok || !sessBody || sessBody.ok !== true || typeof sessBody.token !== "string") {\n' +
    '          if (sessRes.status === 429) {\n' +
    '            var ra = Number(sessRes.headers && sessRes.headers.get && sessRes.headers.get("retry-after")) || 5;\n' +
    '            ratePauseUntil[room] = Date.now() + Math.max(5000, ra * 1000) + Math.floor(Math.random() * 1500);\n' +
    '          }\n' +
    '          var sErr = new Error("Session exchange rejected");\n' +
    '          sErr.status = sessRes.status || 403;\n' +
    '          throw sErr;\n' +
    '        }';
  if (!s.includes(targetSessReject)) throw new Error('Missing targetSessReject in cf-relay.js');
  s = s.replace(targetSessReject, replacementSessReject);

  // G01 (anti-empty-checkpoint before pull completes on cold device) & G06 (507 quota -> close 1013 fallback)
  const targetSocketInit = '      this._liveSeq = 0;\n      this._liveRev = 0;';
  const replacementSocketInit = '      this._liveSeq = 0;\n      this._liveRev = 0;\n      this._pulledOnce = false;';
  if (!s.includes(targetSocketInit)) throw new Error('Missing targetSocketInit in cf-relay.js');
  s = s.replace(targetSocketInit, replacementSocketInit);

  const targetCkptCmd =
    '      if (c.k === "ckpt") {\n' +
    '        var res = { ok: false, conflict: false };\n' +
    '        try {\n' +
    '          var w = await authedRequest(this.room, "POST", "ckpt", null, {';
  const replacementCkptCmd =
    '      if (c.k === "ckpt") {\n' +
    '        // G01: prevent a cold device that has not finished its initial pull from overwriting an existing room checkpoint\n' +
    '        if (!this._pulledOnce && this._liveRev > 0 && Number(c.rev || 0) === 0) {\n' +
    '          if (c.ack === 1 && typeof c.id === "string") {\n' +
    '            this._text({ k: "persist-result", kind: "ckpt", id: c.id, ok: false, conflict: true });\n' +
    '          }\n' +
    '          return;\n' +
    '        }\n' +
    '        var res = { ok: false, conflict: false };\n' +
    '        try {\n' +
    '          var w = await authedRequest(this.room, "POST", "ckpt", null, {';
  if (!s.includes(targetCkptCmd)) throw new Error('Missing targetCkptCmd in cf-relay.js');
  s = s.replace(targetCkptCmd, replacementCkptCmd);

  const targetOpCmd =
    '          var r = await authedRequest(this.room, "POST", "op", null, { id: c.id, c: c.c, lam: Number(c.lam) || 0 });\n' +
    '          ok = !!(r.ok && r.body && r.body.ok === true);';
  const replacementOpCmd =
    '          var r = await authedRequest(this.room, "POST", "op", null, { id: c.id, c: c.c, lam: Number(c.lam) || 0 });\n' +
    '          if (r.status === 507) { this.close(1013, "store quota exceeded; hand over to fallback layer"); return; }\n' +
    '          ok = !!(r.ok && r.body && r.body.ok === true);';
  if (!s.includes(targetOpCmd)) throw new Error('Missing targetOpCmd in cf-relay.js');
  s = s.replace(targetOpCmd, replacementOpCmd);

  const targetCkptAfter =
    '          res.ok = !!(w.ok && w.body && w.body.ok === true);\n' +
    '          res.conflict = !res.ok && (w.status === 409 || !!(w.body && w.body.conflict === true));';
  const replacementCkptAfter =
    '          if (w.status === 507) { this.close(1013, "store quota exceeded; hand over to fallback layer"); return; }\n' +
    '          res.ok = !!(w.ok && w.body && w.body.ok === true);\n' +
    '          res.conflict = !res.ok && (w.status === 409 || !!(w.body && w.body.conflict === true));';
  if (!s.includes(targetCkptAfter)) throw new Error('Missing targetCkptAfter in cf-relay.js');
  s = s.replace(targetCkptAfter, replacementCkptAfter);

  const targetPullPage = '        if (Number(c.v) === 2) {\n          this._text({ k: "pull-page", v: 2, rev: curRev, seq: newSeq, n: Number(pr.body.n) || 0, more: !!pr.body.more });\n        }';
  const replacementPullPage =
    '        if (!pr.body.more) this._pulledOnce = true;\n' +
    '        if (Number(c.v) === 2) {\n' +
    '          this._text({ k: "pull-page", v: 2, rev: curRev, seq: newSeq, n: Number(pr.body.n) || 0, more: !!pr.body.more });\n' +
    '        }';
  if (!s.includes(targetPullPage)) throw new Error('Missing targetPullPage in cf-relay.js');
  s = s.replace(targetPullPage, replacementPullPage);

  return s;
}

export function applyBloque2G07ToG09({ relaySelectorSource, helpUiSource }) {
  let rs = relaySelectorSource;
  let hu = helpUiSource;

  // G07: When Layer 0 (cf-relay) is empty and next layer has data, pause Layer 0 for OTRA_CAPA_LEER_MS (3 min, not 15 min)
  // and record _fallbackRecovery[url] so G08 (markRecovered) releases Layer 0 pause immediately once Firebase pull finishes!
  const targetCapaVacia =
    '    fb.leerHead(url).then(function (n) {\n' +
    '      sumarBajada(capaFb, null, url);\n' +
    '      if (!n || !(n.rev || n.seq) || ws.readyState !== 1) return;\n' +
    '      var c = leer(capa.key); c.pausaHasta = Date.now() + PAUSA_MS; guardar(capa.key, c);\n' +
    '      try { ws.close(1013, "layer empty; next durable layer has data"); } catch (_) {}\n' +
    '    }).catch(function () {});';
  const replacementCapaVacia =
    '    fb.leerHead(url).then(function (n) {\n' +
    '      sumarBajada(capaFb, null, url);\n' +
    '      if (!n || !(n.rev || n.seq) || ws.readyState !== 1) return;\n' +
    '      var pauseMs = capa.key === "f123_relay_cupo_cf_v1" ? OTRA_CAPA_LEER_MS : PAUSA_MS;\n' +
    '      var c = leer(capa.key), until = Date.now() + pauseMs; c.pausaHasta = until; guardar(capa.key, c);\n' +
    '      if (capa.key === "f123_relay_cupo_cf_v1") {\n' +
    '        var prev = _fallbackRecovery[url];\n' +
    '        var list = Array.isArray(prev) ? prev.slice() : (prev ? [prev] : []);\n' +
    '        list.push({ key: capa.key, photo: false, until: until });\n' +
    '        _fallbackRecovery[url] = list;\n' +
    '      }\n' +
    '      try { ws.close(1013, "layer empty; next durable layer has data"); } catch (_) {}\n' +
    '    }).catch(function () {});';
  if (!rs.includes(targetCapaVacia)) throw new Error('Missing targetCapaVacia in relay-selector.js');
  rs = rs.replace(targetCapaVacia, replacementCapaVacia);

  // G09: online/offline listeners in docs/help-ui.js for Sync4 header status pill
  const targetHelpListeners =
    '  window.addEventListener("oc-op-20-recibo", function () { pintarMini(); });\n' +
    '  window.addEventListener("oc-login", function () { setTimeout(function () { pintarMini(); }, 250); });';
  const replacementHelpListeners =
    '  window.addEventListener("oc-op-20-recibo", function () { pintarMini(); });\n' +
    '  window.addEventListener("oc-login", function () { setTimeout(function () { pintarMini(); }, 250); });\n' +
    '  window.addEventListener("online", function () { pintarMini(); });\n' +
    '  window.addEventListener("offline", function () { pintarMini(); });';
  if (!hu.includes(targetHelpListeners)) throw new Error('Missing targetHelpListeners in help-ui.js');
  hu = hu.replace(targetHelpListeners, replacementHelpListeners);

  return { relaySelectorSource: rs, helpUiSource: hu };
}
