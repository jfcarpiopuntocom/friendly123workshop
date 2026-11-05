'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/relay-selector.js'), 'utf8');
function fixture(iso, saved) {
  let now = Date.parse(iso);
  const key = 'f123_relay_cupo_v1', store = new Map([[key, JSON.stringify(saved)]]);
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
    getFullYear() { return new Date(+this - 5 * 3600000).getUTCFullYear(); }
    getMonth() { return new Date(+this - 5 * 3600000).getUTCMonth(); }
    getDate() { return new Date(+this - 5 * 3600000).getUTCDate(); }
  }
  const w = { Date: Clock, localStorage: { getItem: k => store.get(k), setItem: (k,v) => store.set(k,v) }, F123Relay: { connect() {} } };
  w.window = w; vm.runInNewContext(source, w);
  return { state: () => w.F123Relay.estadoCupo()[0], at: iso => { now = Date.parse(iso); }, store, key };
}
test('daily budget survives 19:00 Ecuador and resets at local midnight', () => {
  const f = fixture('2026-11-06T00:01:00Z', { dia:'2026-11-05', up:123, down:456, pausaHasta:0 });
  assert.equal(f.state().up,123);
  assert.equal(f.state().dia,'2026-11-05');
  f.at('2026-11-06T05:00:00Z');
  assert.equal(f.state().up,0);
  assert.equal(f.state().down,0);
  assert.equal(f.state().dia,'2026-11-06');
});
test('upgrading after UTC midnight keeps existing usage until local midnight', () => {
  const f = fixture('2026-11-06T00:01:00Z', { dia:'2026-11-06', up:123, down:456, pausaHasta:0 });
  assert.equal(f.state().dia,'2026-11-05');
  assert.equal(f.state().up,123);
  assert.equal(JSON.parse(f.store.get(f.key)).localDay,true);
  f.at('2026-11-06T05:00:00Z');
  assert.equal(f.state().up,0);
});
test('diagnostics distinguish budget exhaustion from temporary pause without extending either', () => {
  const until=Date.parse('2026-11-05T18:05:00Z');
  const f=fixture('2026-11-05T18:00:00Z',{dia:'2026-11-05',up:0,down:20*1024*1024,pausaHasta:until});
  assert.equal(f.state().pausaHasta,until);
  assert.equal(f.state().cupoAgotado,true);
  assert.equal(f.state().usable,false);
  f.at('2026-11-05T18:06:00Z');
  assert.equal(f.state().usable,false);
});
