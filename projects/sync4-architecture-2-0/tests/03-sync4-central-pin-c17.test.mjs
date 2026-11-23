import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCentralPinAllRoles } from '../src/sync4-central-pin-client.mjs';

function mockFetch(routes) {
  const calls = [];
  const fn = async (url, init) => {
    const pathname = new URL(url).pathname;
    const body = JSON.parse(init.body);
    calls.push({ url, pathname, body, cache: init.cache });
    const handler = routes[pathname];
    if (!handler) return { ok: false, status: 404, json: async () => ({ ok: false, reason: 'not-found' }) };
    return handler(body);
  };
  return { fn, calls };
}

test('Sync4 C17: Owner, Admin, and Employee PINs resolve centrally via JFC panel without Sync3', async () => {
  const { fn, calls } = mockFetch({
    '/pin/verify': (body) => body.pin === '111'
      ? { ok: true, status: 200, json: async () => ({ ok: true, revision: 7 }) }
      : { ok: false, status: 403, json: async () => ({ ok: false, reason: 'wrong-pin' }) },
    '/team/verify': (body) => {
      if (body.pin === '222') {
        return { ok: true, status: 200, json: async () => ({ ok: true, principal: { subject: 'adm-1', role: 'admin', roleRevision: 3 } }) };
      }
      if (body.pin === '333') {
        return { ok: true, status: 200, json: async () => ({ ok: true, principal: { subject: 'emp-9', role: 'empleado', roleRevision: 3 } }) };
      }
      return { ok: false, status: 403, json: async () => ({ ok: false, reason: 'wrong-pin' }) };
    }
  });

  const base = { licenseCode: 'F123-TEST-SYNC4-0001', instanceId: 'inst-new-iphone-1', fetchImpl: fn };

  // Owner unlocks via /pin/verify
  const rOwner = await verifyCentralPinAllRoles({ ...base, pin: '111' });
  assert.equal(rOwner.ok, true);
  assert.equal(rOwner.role, 'dueno');
  assert.equal(rOwner.revision, 7);

  // Admin unlocks via /team/verify (zero Sync3 wait!)
  const rAdmin = await verifyCentralPinAllRoles({ ...base, pin: '222' });
  assert.equal(rAdmin.ok, true);
  assert.equal(rAdmin.role, 'admin');
  assert.equal(rAdmin.subject, 'adm-1');

  // Employee unlocks via /team/verify (zero Sync3 wait!)
  const rEmp = await verifyCentralPinAllRoles({ ...base, pin: '333' });
  assert.equal(rEmp.ok, true);
  assert.equal(rEmp.role, 'empleado');
  assert.equal(rEmp.subject, 'emp-9');

  // Wrong PIN rejected cleanly
  const rWrong = await verifyCentralPinAllRoles({ ...base, pin: '999' });
  assert.equal(rWrong.ok, false);
  assert.equal(rWrong.status, 'wrong');

  // Never leaked PIN in URL query string; always cache: no-store
  assert.ok(calls.every(c => !c.url.includes('111') && !c.url.includes('222') && !c.url.includes('333')));
  assert.ok(calls.every(c => c.cache === 'no-store'));
});

test('Sync4 C17 security: rejects untrusted panel origins and handles 429/network errors fail-closed', async () => {
  await assert.rejects(
    () => verifyCentralPinAllRoles({
      licenseCode: 'F123-TEST-SYNC4-0001',
      instanceId: 'inst-new-iphone-1',
      pin: '111',
      panelOrigin: 'https://evil.example.com',
      fetchImpl: async () => { throw new Error('must not be called'); }
    }),
    /central-panel-origin-denied/
  );

  const rNet = await verifyCentralPinAllRoles({
    licenseCode: 'F123-TEST-SYNC4-0001',
    instanceId: 'inst-new-iphone-1',
    pin: '111',
    fetchImpl: async () => { throw new Error('offline'); }
  });
  assert.equal(rNet.ok, false);
  assert.equal(rNet.status, 'network-unavailable');
});
