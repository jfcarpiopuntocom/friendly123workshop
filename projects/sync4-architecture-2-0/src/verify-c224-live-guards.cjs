'use strict';
// G33: Non-destructive live smoke verifier for friendly-123 v0.9.02 + friendly123-relay-privado.
// Checks live GitHub Pages version/assets and Cloudflare Worker CORS & fail-closed auth boundaries.
// Zero customer data is read or written.
const PAGES_BASE = 'https://jfcarpiopuntocom.github.io/friendly-123';
const RELAY_BASE = 'https://friendly123-relay-privado.jfcarpio.workers.dev';
const SYNTH_ROOM = '0'.repeat(40) + '-y';

async function check() {
  const results = {};

  // 1. Live version.json
  const vRes = await fetch(PAGES_BASE + '/version.json', { cache: 'no-store' });
  const vJson = await vRes.json().catch(() => null);
  results.pagesVersion = {
    status: vRes.status,
    version: vJson?.version || null,
    shell: vJson?.shell || null,
    cacheGeneration: vJson?.cacheGeneration || null
  };

  // 2. Live cf-relay.min.js asset on Pages
  const cfAsset = await fetch(PAGES_BASE + '/cf-relay.min.js', { method: 'HEAD', cache: 'no-store' }).catch(() => null);
  results.cfRelayAssetStatus = cfAsset ? cfAsset.status : null;

  // 3. Live friendly123-relay-privado CORS preflight (allowed origin -> 204, foreign origin -> 403)
  try {
    const corsOk = await fetch(`${RELAY_BASE}/f123/${SYNTH_ROOM}/head`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://jfcarpiopuntocom.github.io',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    });
    const corsBad = await fetch(`${RELAY_BASE}/f123/${SYNTH_ROOM}/head`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil.example',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
      }
    });
    const unauth = await fetch(`${RELAY_BASE}/f123/${SYNTH_ROOM}/head`, {
      method: 'GET',
      headers: { 'Origin': 'https://jfcarpiopuntocom.github.io' }
    });
    results.relayWorker = {
      reachable: true,
      corsAllowedOriginStatus: corsOk.status,
      corsForeignOriginStatus: corsBad.status,
      unauthenticatedHeadStatus: unauth.status,
      pass: corsOk.status === 204 && corsBad.status === 403 && unauth.status === 401
    };
  } catch (err) {
    results.relayWorker = { reachable: false, error: err.message };
  }

  console.log(JSON.stringify(results, null, 2));
}

check();
