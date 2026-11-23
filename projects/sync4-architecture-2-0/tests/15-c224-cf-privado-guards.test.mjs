import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATCH_DIR = path.resolve(__dirname, '..', 'patches-v895');

test('C224 Patch 12: sync-yjs keeps Cloudflare E2E private relay active during 2.0 while preserving C54/C56 legacy fence', () => {
  const p12 = fs.readFileSync(path.join(PATCH_DIR, '12-v901-sync-yjs-cf-privado-always-syncs.patch'), 'utf8');
  assert.match(p12, /relayLayer === "f123_relay_cupo_cf_v1"/, 'only Cloudflare 2.0 encrypted private relay bypasses the legacy silence fence');
  assert.match(p12, /if \(!API\.modoCorte20Activo \|\| API\.canal === API\.canalPiloto \|\| cfPrivadoActivo\)/);
  assert.match(p12, /if \(!API\.modoCorte20Activo && API\.canalSombra && API\.canalSombra !== API\.canal\)/, 'C54/C56 legacy shadow fence stays intact');
});

test('C224 Patch 13: relay-selector places F123CloudflareRelay first with DO budget and pauses all pre-Firebase layers on recovery', () => {
  const p13 = fs.readFileSync(path.join(PATCH_DIR, '13-v901-relay-selector-3layer-cf-privado.patch'), 'utf8');
  assert.match(p13, /var cf = window\.F123CloudflareRelay/);
  assert.match(p13, /f123_relay_cupo_cf_v1/);
  assert.match(p13, /CAP_CF_UP = 32 \* 1024 \* 1024/);
  assert.match(p13, /CAP_CF_DOWN = 128 \* 1024 \* 1024/);
  assert.match(p13, /for \(var i = 0; i < capas\.length && capas\[i\]\.relay !== fb; i\+\+\)/, 'leerFirebase pauses every layer ahead of Firebase');
  assert.match(p13, /Array\.isArray\(raw\) \? raw : \[raw\]/, 'resolverRecuperacion restores every paused pre-Firebase layer');
});
