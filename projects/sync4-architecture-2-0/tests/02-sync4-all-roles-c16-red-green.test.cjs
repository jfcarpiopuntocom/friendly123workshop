'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { patchYPartyPiloto, patchSyncYjs } = require('../src/sync4-all-roles-patcher.cjs');

const REAL_YPARTY = 'C:/00 Projects/claude-f123/wt-multisala/src/yparty-piloto.js';
const REAL_SYNC_YJS = 'C:/00 Projects/claude-f123/wt-multisala/docs/sync-yjs.js';

test('RED on v0.8.90 -> GREEN patched (C16): all commercial roles (dueno, admin, empleado) enter Sync4 / 2.0', () => {
  if (!fs.existsSync(REAL_YPARTY) || !fs.existsSync(REAL_SYNC_YJS)) return;

  const rawYp = fs.readFileSync(REAL_YPARTY, 'utf8');
  const rawSy = fs.readFileSync(REAL_SYNC_YJS, 'utf8');

  // RED checks against unpatched v0.8.90:
  assert.ok(rawYp.includes('try { ownerCredentials(instanceId); } catch (_) { throw unavailable(); }'),
    'RED: unpatched crearCoordinadorCorte20 hardcodes ownerCredentials');
  assert.ok(!rawYp.includes("scope === 'cat:read'"),
    'RED: unpatched solicitarTicketComercialEquipo omits cat:read for admin/empleado');
  assert.ok(rawSy.includes('if (demoQa || (rolQa !== "dueno" && rolQa !== "admin")) return;'),
    'RED: unpatched _intentarActivarCorte20SiElegible blocks empleado');
  assert.ok(rawSy.includes('return API.activarCorte20Runtime({ cortarComercio: true });'),
    'RED: unpatched activarCorte20Runtime omits permitirDespachoEquipo, disarming admin/empleado');

  // Apply C16 Sync4 all-roles patch
  const ypRes = patchYPartyPiloto(rawYp);
  const syRes = patchSyncYjs(rawSy);
  assert.equal(ypRes.changed, true);
  assert.equal(syRes.changed, true);

  // GREEN checks:
  // 1. Coordinator accepts commercialCredentials (dueno, admin, empleado) and routes
  //    dueno -> certified -cat writer, admin/empleado -> certified READ-ONLY -cat reader!
  assert.ok(ypRes.source.includes('try { commercialCredentials(instanceId); } catch (_) { throw unavailable(); }'));
  assert.ok(ypRes.source.includes("activeRole === 'dueno'"));
  assert.ok(ypRes.source.includes('this.leerCatalogoPublicoCertificado(privateDoc, expectedFrozenHead, createProvider'));
  // 2. Team ticket helper supports cat:read on -cat room
  assert.ok(ypRes.source.includes("scope === 'cat:read'"));
  assert.ok(ypRes.source.includes("? sala + '-cat'"));
  // 3. Read-only catalog reader accepts commercialCredentials (not dueno-only)
  assert.ok(ypRes.source.includes('const getCredentials = () => commercialCredentials(instanceId);'));
  // 4. sync-yjs allows dueno, admin, AND empleado and passes permitirDespachoEquipo
  assert.ok(syRes.source.includes('if (demoQa || (rolQa !== "dueno" && rolQa !== "admin" && rolQa !== "empleado")) return;'));
  assert.ok(syRes.source.includes('permitirDespachoEquipo: rolQa === "admin" || rolQa === "empleado"'));
});
