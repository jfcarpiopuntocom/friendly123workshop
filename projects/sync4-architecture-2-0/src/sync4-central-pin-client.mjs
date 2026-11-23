// Sync4 C17: Central PIN resolution via JFC's private panel Worker
// (friendly123-licencias.jfcarpio.workers.dev) for ALL roles (Owner + Admin + Employee).
//
// Why this matters (C17, 22 nov 2026):
// Previously, new/linked devices waited on legacy Sync3 to deliver Team/Admin PINs.
// Because Sync3 hung on "conectando", linked devices could never unlock and Sync4
// never started. JFC's rule: "TODOS LOS PIN DEBEN ESTAR CENTRALMENTE COORDINADOS
// MEDIANTE MI PANEL JFC PRIVADO".
//
// Security invariants preserved:
// - HTTPS strict origin allowlist (`friendly123-licencias.jfcarpio.workers.dev` only).
// - Never sends PIN in query string or logs; JSON POST body with `cache: 'no-store'`.
// - Never treats network outage / 5xx as a valid login; returns explicit status so
//   already-verified offline devices can still use their previously adopted local PIN.

const ALLOWED_PANEL_HOST = 'friendly123-licencias.jfcarpio.workers.dev';
const PIN_RE = /^[0-9]{3}$/;
const LICENSE_RE = /^F123-[A-Z0-9*~$=-]{8,34}$/;
const INSTANCE_RE = /^[A-Za-z0-9_-]{6,120}$/;

function validateEndpoint(panelOrigin) {
  const url = new URL(panelOrigin || `https://${ALLOWED_PANEL_HOST}`);
  if (url.protocol !== 'https:' || url.hostname !== ALLOWED_PANEL_HOST) {
    throw new Error('central-panel-origin-denied');
  }
  return url.origin;
}

export async function verifyCentralPinAllRoles({
  licenseCode,
  instanceId,
  pin,
  subject = null,
  panelOrigin = `https://${ALLOWED_PANEL_HOST}`,
  fetchImpl = globalThis.fetch,
  timeoutMs = 6000
} = {}) {
  const lic = String(licenseCode || '').trim().toUpperCase();
  const inst = String(instanceId || '').trim();
  const code = String(pin || '').trim();
  if (!LICENSE_RE.test(lic) || !INSTANCE_RE.test(inst) || !PIN_RE.test(code)) {
    return { ok: false, status: 'invalid-input', role: null };
  }
  if (typeof fetchImpl !== 'function') {
    return { ok: false, status: 'network-unavailable', role: null };
  }

  const origin = validateEndpoint(panelOrigin);

  async function postJson(path, body) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetchImpl(origin + path, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      });
      const data = await res.json().catch(() => null);
      return { httpStatus: res.status, ok: res.ok, data };
    } catch (_) {
      return { httpStatus: 0, ok: false, data: null, networkError: true };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // 1. Check central Owner authority first (/pin/verify)
  const ownerRes = await postJson('/pin/verify', {
    licenseCode: lic,
    instanceId: inst,
    pin: code
  });
  if (ownerRes.networkError) {
    return { ok: false, status: 'network-unavailable', role: null };
  }
  if (ownerRes.ok && ownerRes.data?.ok === true) {
    return {
      ok: true,
      status: 'owner',
      role: 'dueno',
      revision: ownerRes.data.revision,
      principal: { kind: 'owner', licenseCode: lic, instanceId: inst, role: 'dueno' }
    };
  }
  if (ownerRes.httpStatus === 429 || ownerRes.data?.reason === 'locked' || ownerRes.data?.reason === 'rate-limited') {
    return { ok: false, status: 'locked', role: null };
  }

  // 2. If not Owner, check central Team authority (/team/verify) so Admin & Employees
  // unlock directly from JFC's central panel without waiting for legacy Sync3!
  const teamBody = { licenseCode: lic, instanceId: inst, pin: code };
  if (subject) teamBody.subject = String(subject).trim();
  const teamRes = await postJson('/team/verify', teamBody);
  if (teamRes.networkError) {
    return { ok: false, status: 'network-unavailable', role: null };
  }
  if (teamRes.ok && teamRes.data?.ok === true && teamRes.data?.principal) {
    const p = teamRes.data.principal;
    const role = String(p.role || '').trim().toLowerCase();
    if (role === 'admin' || role === 'empleado') {
      return {
        ok: true,
        status: 'team',
        role,
        revision: p.roleRevision,
        subject: p.subject,
        principal: {
          kind: 'team',
          licenseCode: lic,
          instanceId: inst,
          subject: p.subject,
          role,
          roleRevision: p.roleRevision
        }
      };
    }
  }
  if (teamRes.httpStatus === 429 || teamRes.data?.reason === 'rate-limited') {
    return { ok: false, status: 'locked', role: null };
  }

  // Distinguish unprovisioned central authority vs definite wrong PIN
  const ownerUnconfigured = ownerRes.httpStatus === 404 && ownerRes.data?.reason === 'unconfigured';
  const teamUnavailable = teamRes.httpStatus === 404 || teamRes.httpStatus === 503;
  if (ownerUnconfigured && teamUnavailable) {
    return { ok: false, status: 'unconfigured', role: null };
  }

  return { ok: false, status: 'wrong', role: null };
}
