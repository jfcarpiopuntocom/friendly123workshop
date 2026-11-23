// Sync4 Engine — Architecture 2.0 primary route (A) + 2 non-blocking reinforcing
// fallbacks (B: independent durable relay, C: local durable outbox + peer catch-up).
//
// Design rules (JFC S18 / C16 / C17, 22 nov 2026):
// 1. Primary route A is Architecture 2.0 (YParty DO/SQLite + typed commercial ops).
// 2. Fallbacks B and C SUPPORT and REINFORCE without EVER blocking sales, login, PIN,
//    or UI. A quota/429/403/5xx outage on B trips a bounded circuit breaker immediately.
// 3. Same canonical `opId` across A/B/C:
//    - Concurrent calls with identical (license, opId, canonicalPayload) coalesce into
//      ONE single in-flight attempt (no double dispatch).
//    - Conflicting payload for the same `opId` fails closed BEFORE touching A, B, or C.
// 4. Every accepted operation is persisted durably in local outbox BEFORE remote dispatch.
//    Remote failures NEVER erase local data and NEVER fabricate a committed ACK.
// 5. All commercial roles (`dueno`, `admin`, `empleado`) use Sync4 (no role left on Sync3).

const VALID_ROLES = new Set(['dueno', 'admin', 'empleado']);
const OP_ID_RE = /^(?:customer-payment:)?[A-Za-z0-9_:-]{6,128}$/;

export function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(value[k])).join(',') + '}';
}

function isQuotaOrOutageError(err, res) {
  const status = Number(res?.status || err?.status || 0);
  if (status === 403 || status === 429 || status >= 500) return true;
  const code = String(res?.code || err?.code || res?.reason || err?.message || '').toLowerCase();
  return /quota|egress|rate.?limit|429|timeout|network|offline|unavailable|503|502/.test(code);
}

function byteLengthOf(str) {
  return new TextEncoder().encode(str).byteLength;
}

export function createCircuitBreaker({
  failureThreshold = 2,
  baseCooldownMs = 30_000,
  maxCooldownMs = 600_000,
  clock = Date.now
} = {}) {
  let consecutiveFailures = 0;
  let openUntil = 0;
  let lastReason = null;

  return {
    isOpen() {
      return clock() < openUntil;
    },
    remainingMs() {
      return Math.max(0, openUntil - clock());
    },
    recordSuccess() {
      consecutiveFailures = 0;
      openUntil = 0;
      lastReason = null;
    },
    recordFailure(reason, { immediateOpen = false } = {}) {
      consecutiveFailures++;
      lastReason = String(reason || 'transport-error');
      if (immediateOpen || consecutiveFailures >= failureThreshold) {
        const exp = Math.max(0, consecutiveFailures - failureThreshold);
        const cooldown = Math.min(maxCooldownMs, baseCooldownMs * Math.pow(2, exp));
        openUntil = clock() + cooldown;
      }
      return { open: this.isOpen(), cooldownMs: this.remainingMs(), consecutiveFailures, lastReason };
    },
    snapshot() {
      return {
        open: this.isOpen(),
        remainingMs: this.remainingMs(),
        consecutiveFailures,
        lastReason
      };
    }
  };
}

export function createSync4Engine({
  licenseCode,
  role,
  outbox,
  primaryA,
  fallbackB = null,
  fallbackC = null,
  maxDailyFallbackBBytes = 2 * 1024 * 1024, // 2 MiB hard daily safety budget for fallback B
  clock = Date.now,
  onTelemetry = null
} = {}) {
  const normLicense = String(licenseCode || '').trim().toUpperCase();
  const normRole = String(role || '').trim().toLowerCase();
  if (!normLicense) throw new TypeError('Sync4 requires licenseCode');
  if (!VALID_ROLES.has(normRole)) throw new TypeError(`Sync4 unsupported commercial role: ${normRole}`);
  if (!outbox || typeof outbox.put !== 'function' || typeof outbox.get !== 'function' ||
      typeof outbox.markCommitted !== 'function' || typeof outbox.listPending !== 'function') {
    throw new TypeError('Sync4 requires durable outbox (put/get/markCommitted/listPending)');
  }
  if (!primaryA || typeof primaryA.send !== 'function') {
    throw new TypeError('Sync4 requires primaryA (Architecture 2.0 transport)');
  }

  const breakerA = createCircuitBreaker({ failureThreshold: 3, baseCooldownMs: 5_000, maxCooldownMs: 60_000, clock });
  const breakerB = createCircuitBreaker({ failureThreshold: 1, baseCooldownMs: 60_000, maxCooldownMs: 600_000, clock });
  const inFlight = new Map(); // key: license::opId -> { payloadHash, promise }
  let fallbackBDay = '';
  let fallbackBBytesToday = 0;

  function emit(event) {
    if (typeof onTelemetry === 'function') {
      try { onTelemetry({ ...event, licenseCode: normLicense, role: normRole, at: clock() }); } catch (_) {}
    }
  }

  function resetDailyBudgetIfNeeded() {
    const day = new Date(clock()).toISOString().slice(0, 10);
    if (day !== fallbackBDay) {
      fallbackBDay = day;
      fallbackBBytesToday = 0;
    }
  }

  function canUseFallbackB(payloadBytes) {
    if (!fallbackB || typeof fallbackB.send !== 'function') return { ok: false, reason: 'fallback-b-unconfigured' };
    if (breakerB.isOpen()) return { ok: false, reason: 'fallback-b-circuit-open' };
    resetDailyBudgetIfNeeded();
    if (fallbackBBytesToday + payloadBytes > maxDailyFallbackBBytes) {
      breakerB.recordFailure('daily-byte-budget-exceeded', { immediateOpen: true });
      return { ok: false, reason: 'fallback-b-budget-exceeded' };
    }
    return { ok: true };
  }

  async function tryLayer(name, transport, breaker, record, payloadBytes, countBudget) {
    if (breaker.isOpen()) {
      return { ok: false, skipped: true, reason: `${name}-circuit-open` };
    }
    try {
      const res = await transport.send({
        licenseCode: normLicense,
        role: normRole,
        opId: record.opId,
        payload: record.payload
      });
      if (countBudget) {
        resetDailyBudgetIfNeeded();
        fallbackBBytesToday += payloadBytes;
      }
      if (res && res.committed === true) {
        breaker.recordSuccess();
        return { ok: true, layer: name, receipt: res };
      }
      if (res && res.conflict === true) {
        return { ok: false, conflict: true, layer: name, reason: res.reason || 'opid-conflict' };
      }
      const quotaHit = isQuotaOrOutageError(null, res);
      breaker.recordFailure(res?.reason || `${name}-not-committed`, { immediateOpen: quotaHit });
      return { ok: false, layer: name, reason: res?.reason || `${name}-rejected`, quotaHit };
    } catch (err) {
      const quotaHit = isQuotaOrOutageError(err, null);
      breaker.recordFailure(err?.message || `${name}-threw`, { immediateOpen: quotaHit });
      return { ok: false, layer: name, reason: err?.message || `${name}-error`, quotaHit };
    }
  }

  async function dispatchRecord(record, canonicalPayload) {
    const payloadBytes = byteLengthOf(canonicalPayload);

    // 1. Primary Route A (Architecture 2.0)
    const resA = await tryLayer('A-arch20', primaryA, breakerA, record, payloadBytes, false);
    if (resA.ok) {
      await outbox.markCommitted(record.opId, { layer: 'A-arch20', receipt: resA.receipt, at: clock() });
      emit({ type: 'committed', layer: 'A-arch20', opId: record.opId });
      return {
        ok: true,
        localDurable: true,
        committed: true,
        blocked: false,
        layer: 'A-arch20',
        opId: record.opId,
        receipt: resA.receipt
      };
    }
    if (resA.conflict) {
      emit({ type: 'conflict', layer: 'A-arch20', opId: record.opId, reason: resA.reason });
      return {
        ok: false,
        localDurable: true,
        committed: false,
        conflict: true,
        blocked: false,
        layer: 'A-arch20',
        opId: record.opId,
        reason: resA.reason
      };
    }

    // 2. Fallback B (Independent durable relay reinforcement — strict circuit breaker & byte budget)
    const bGate = canUseFallbackB(payloadBytes);
    let resB = { ok: false, skipped: true, reason: bGate.reason };
    if (bGate.ok) {
      resB = await tryLayer('B-relay', fallbackB, breakerB, record, payloadBytes, true);
      if (resB.ok) {
        await outbox.markCommitted(record.opId, { layer: 'B-relay', receipt: resB.receipt, at: clock() });
        emit({ type: 'committed', layer: 'B-relay', opId: record.opId });
        return {
          ok: true,
          localDurable: true,
          committed: true,
          blocked: false,
          layer: 'B-relay',
          opId: record.opId,
          receipt: resB.receipt
        };
      }
    }

    // 3. Fallback C (Peer/local reinforcement — NEVER blocks sales/UI, keeps op durable in outbox)
    let cHint = null;
    if (fallbackC && typeof fallbackC.reinforce === 'function') {
      try {
        cHint = await fallbackC.reinforce({
          licenseCode: normLicense,
          role: normRole,
          opId: record.opId,
          payload: record.payload
        });
      } catch (err) {
        cHint = { relayed: false, reason: err?.message || 'peer-unavailable' };
      }
    }

    emit({
      type: 'queued-durable',
      layer: 'C-local-peer',
      opId: record.opId,
      reasonA: resA.reason,
      reasonB: resB.reason
    });

    // Crucial S18 invariant: NEVER blocks the user's sale/UI AND NEVER fakes committed:true!
    return {
      ok: true,
      localDurable: true,
      committed: false,
      queuedForCatchUp: true,
      blocked: false,
      layer: 'C-local-peer',
      opId: record.opId,
      fallbackReasons: { A: resA.reason, B: resB.reason },
      peerHint: cHint
    };
  }

  function submit({ opId, payload } = {}) {
    if (typeof opId !== 'string' || !OP_ID_RE.test(opId)) {
      return Promise.reject(new TypeError('Sync4 invalid opId'));
    }
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new TypeError('Sync4 payload object required'));
    }

    const canonicalPayload = canonicalStringify(payload);
    const key = normLicense + '::' + opId;

    // 1. Synchronous in-flight same-opId coalescing + conflict fail-closed BEFORE any await or transport touch
    const existingFlight = inFlight.get(key);
    if (existingFlight) {
      if (existingFlight.canonicalPayload !== canonicalPayload) {
        const err = new Error(`Sync4 conflicting payload for in-flight opId ${opId}`);
        err.code = 'OPID_PAYLOAD_CONFLICT';
        return Promise.reject(err);
      }
      return existingFlight.promise;
    }

    // 2. Register in-flight slot synchronously BEFORE awaiting outbox so same-tick callers coalesce cleanly
    const promise = (async () => {
      const persisted = await outbox.get(opId);
      if (persisted) {
        if (persisted.canonicalPayload !== canonicalPayload) {
          const err = new Error(`Sync4 conflicting payload for persisted opId ${opId}`);
          err.code = 'OPID_PAYLOAD_CONFLICT';
          throw err;
        }
        if (persisted.committed === true) {
          return {
            ok: true,
            localDurable: true,
            committed: true,
            duplicate: true,
            blocked: false,
            layer: persisted.committedLayer || 'already-committed',
            opId
          };
        }
      } else {
        await outbox.put({
          opId,
          licenseCode: normLicense,
          role: normRole,
          payload,
          canonicalPayload,
          committed: false,
          createdAt: clock()
        });
      }
      return dispatchRecord({ opId, payload, canonicalPayload }, canonicalPayload);
    })().finally(() => {
      if (inFlight.get(key)?.promise === promise) inFlight.delete(key);
    });

    inFlight.set(key, { canonicalPayload, promise });
    return promise;
  }

  async function drainPending({ limit = 25 } = {}) {
    const pending = await outbox.listPending();
    const slice = pending.slice(0, limit);
    const results = [];
    for (const row of slice) {
      // If both A and B circuits are open, stop early (no retry storm!)
      if (breakerA.isOpen() && (!fallbackB || breakerB.isOpen())) {
        results.push({ opId: row.opId, skipped: true, reason: 'all-remote-circuits-open' });
        break;
      }
      const r = await submit({ opId: row.opId, payload: row.payload });
      results.push(r);
    }
    return results;
  }

  function status() {
    resetDailyBudgetIfNeeded();
    return {
      engine: 'sync4',
      licenseCode: normLicense,
      role: normRole,
      primaryA: { healthy: !breakerA.isOpen(), ...breakerA.snapshot() },
      fallbackB: {
        configured: Boolean(fallbackB),
        healthy: Boolean(fallbackB) && !breakerB.isOpen(),
        bytesUsedToday: fallbackBBytesToday,
        maxDailyBytes: maxDailyFallbackBBytes,
        ...breakerB.snapshot()
      },
      fallbackC: { configured: Boolean(fallbackC), nonBlocking: true },
      inFlightCount: inFlight.size
    };
  }

  return Object.freeze({ submit, drainPending, status });
}
