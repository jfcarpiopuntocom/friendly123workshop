'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { ORIGINAL_SNIPPET, applyPatchToSource } = require('../src/post-pin-boot-guard.cjs');

const REAL_APP_INLINE = 'C:/00 Projects/claude-f123/wt-multisala/src/app/app-inline-01.js';

function buildTailHarness(tailCode, opts = {}) {
  let ubicCalls = 0, hoyCalls = 0;
  const listeners = new Map(), docListeners = new Map();
  const gate = opts.gateMounted === false ? null : { style: { display: opts.gateHidden ? 'none' : 'flex' } };
  let currentRole = opts.role ?? null;
  const doc = {
    readyState: opts.readyState || 'interactive',
    getElementById: (id) => (id === 'oc-gate' ? gate : null),
    addEventListener: (ev, fn) => { if (!docListeners.has(ev)) docListeners.set(ev, []); docListeners.get(ev).push(fn); }
  };
  const win = {
    OC_DEMO: !!opts.demo,
    OCAuth: opts.noAuth ? undefined : { rolActual: () => currentRole },
    addEventListener: (ev, fn) => { if (!listeners.has(ev)) listeners.set(ev, []); listeners.get(ev).push(fn); }
  };
  const sandbox = {
    window: win, document: doc, console, Promise, setTimeout: () => 0,
    cargarUbicaciones: async () => { ubicCalls++; },
    cargarHoy: async () => { hoyCalls++; },
    t: (k) => k
  };
  vm.runInNewContext(`async function cargarDashboardInicial(){await cargarUbicaciones();await cargarHoy();}\n${tailCode}`, sandbox);
  return {
    getCounts: () => ({ ubicCalls, hoyCalls }),
    setRole: (r) => { currentRole = r; },
    setGateDisplay: (d) => { if (gate) gate.style.display = d; },
    emitWin: (ev) => (listeners.get(ev) || []).forEach(fn => fn({ type: ev })),
    flush: () => new Promise(r => setImmediate(r))
  };
}

test('RED -> GREEN: stops pre-PIN cargarDashboardInicial(0) and coalesces post-PIN oc-login', async () => {
  const baseSrc = fs.existsSync(REAL_APP_INLINE) ? fs.readFileSync(REAL_APP_INLINE, 'utf8') : `${ORIGINAL_SNIPPET}\n`;
  const red = buildTailHarness(ORIGINAL_SNIPPET, { gateHidden: false, role: null });
  await red.flush();
  assert.equal(red.getCounts().hoyCalls, 1, 'RED: unpatched code loads Hoy behind PIN');

  const { changed, source } = applyPatchToSource(baseSrc);
  assert.equal(changed, true);
  const start = source.indexOf('let _dashboardInicialEnCurso');
  const end = source.indexOf('// Splash de arranque:', start);
  const tail = end > start ? source.slice(start, end) : source.slice(start);

  const g = buildTailHarness(tail, { gateHidden: false, role: null });
  await g.flush();
  assert.deepEqual(g.getCounts(), { ubicCalls: 0, hoyCalls: 0 });

  g.setRole('empleado');
  g.setGateDisplay('none');
  g.emitWin('oc-login');
  g.emitWin('oc-login');
  await g.flush();
  await g.flush();
  assert.deepEqual(g.getCounts(), { ubicCalls: 1, hoyCalls: 1 });
});
