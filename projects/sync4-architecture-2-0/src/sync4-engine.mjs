// Sync4 Engine v2 — Architecture 2.0 primary route (A) + 2 non-blocking reinforcing
// fallbacks (B: independent durable relay, C: local durable outbox + peer catch-up).
//
// Enforces S18 / C16 / C17 and Micropasos 23, 32, 34-44, 56-61 of the Sync4 plan:
// 1. Primary A = Architecture 2.0 (YParty DO/SQLite + typed commercial ops).
// 2. Fallbacks B & C support and reinforce WITHOUT EVER blocking sales, PIN, or UI.
// 3. Micropaso 39: HTTP 202 / `stored-for-application` / `connected` WITHOUT proven
//    persistence (`committed === true`) is NEVER treated as committed; keeps opId durable
//    with `pendingAck: true` for idempotent reconciliation.
// 4. Synchronous in-flight coalescing by (license, opId) + fail-closed OPID_PAYLOAD_CONFLICT
//    before touching outbox or any remote transport.
// 5. Micropaso 43/60: `reconcileAndFailbackToA()` absorbs & verifies EVERY pending/202 opId
//    against A before declaring steady-state A ready (safe under partial ACK).
// 6. Micropaso 32: exposes per-license / per-opId `diagnostics()` without PII/PINs.

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

function isUnproven202(res) {
  if (!res || typeof res !== 'object') return false;
  if (res.committed === true) return false;
  return res.status === 202 || res.stage === 'stored-for-application' || res.connected === true;
}

function byteLengthOf(str) {
  return new TextEncoder().encode(str).byteLength;
}

/**
 * Serializable durable outbox adapter for browser-restart recovery tests (Micropaso 61)
 * and clean localStorage/IDB bridging.
 */
export function createJsonOutbox(initialSnapshot = null) {
  const rows = new Map();
  if (initialSnapshot) {
    const parsed = typeof initialSnapshot === 'string' ? JSON.parse(initialSnapshot) : initialSnapshot;
    if (Array.isArray(parsed)) {
      for (const row of parsed) {
        if (row && typeof row.opId === 'string') rows.set(row.opId, structuredClone(row));
      }
    }
  }
  return {
    rows,
    async put(rec) { rows.set(rec.opId, structuredClone(rec)); },
    async get(opId) { return rows.has(opId) ? structuredClone(rows.get(opId)) : null; },
    async markPendingAck(opId, meta) {
      const cur = rows.get(opId);
      if (cur && cur.committed !== true) {
        rows.set(opId, { ...cur, pendingAck: true, lastPendingAckMeta: structuredClone(meta) });
      }
    },
    async markCommitted(opId, meta) {
      const cur = rows.get(opId);
      if (cur) {
        rows.set(opId, {
          ...cur,
          committed: true,
          pendingAck: false,
          committedLayer: meta.layer,
          receipt: structuredClone(meta.receipt),
          committedAt: meta.at
        });
      }
    },
    async listPending() {
      return [...rows.values()].filter(r => r.committed !== true).map(r => structuredClone(r));
    },
    exportSnapshot() {
      return JSON.stringify([...rows.values()]);
    }
  };
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
    isOpen() { return clock() < openUntil; },
    remainingMs() { return Math.max(0, openUntil - clock()); },
    recordSuccess() { consecutiveFailures = 0; openUntil = 0; lastReason = null; },
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
      return { open: this.isOpen(), remainingMs: this.remainingMs(), consecutiveFailures, lastReason };
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
  maxDailyFallbackBBytes = 2 * 1024 * 1024,
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
  const inFlight = new Map();
  const recentOps = []; // Bounded ring buffer (max 64) for Micropaso 32 diagnostics (no PII/PIN)
  let fallbackBDay = '';
  let fallbackBBytesToday = 0;
  let lastEffectiveRoute = 'sync4-a-2.0';

  function recordDiag(entry) {
    recentOps.push({ ...entry, at: clock() });
    if (recentOps.length > 64) recentOps.shift();
  }

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
        return { ok: true, layer: name, receipt: res.receipt !== undefined ? res.receipt : res };
      }
      if (res && res.conflict === true) {
        return { ok: false, conflict: true, layer: name, reason: res.reason || 'opid-conflict' };
      }
      // Micropaso 39: HTTP 202 / stored-for-application / connected is NEVER a committed ACK!
      if (isUnproven202(res)) {
        if (typeof outbox.markPendingAck === 'function') {
          await outbox.markPendingAck(record.opId, { layer: name, status: res.status || 202, stage: res.stage || 'unproven' });
        }
        return {
          ok: false,
          pendingAck: true,
          layer: name,
          reason: `${name}-unproven-persistence-202`
        };
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

  async function dispatchRecord(record, canonicalPayload, { primaryOnly = false } = {}) {
    const payloadBytes = byteLengthOf(canonicalPayload);

    // 1. Primary Route A (Architecture 2.0)
    const resA = await tryLayer('A-arch20', primaryA, breakerA, record, payloadBytes, false);
    if (resA.ok) {
      lastEffectiveRoute = 'sync4-a-2.0';
      await outbox.markCommitted(record.opId, { layer: 'A-arch20', receipt: resA.receipt, at: clock() });
      recordDiag({ opId: record.opId, layer: 'A-arch20', committed: true, pendingAck: false });
      emit({ type: 'committed', layer: 'A-arch20', opId: record.opId });
      return {
        ok: true,
        localDurable: true,
        committed: true,
        pendingAck: false,
        blocked: false,
        layer: 'A-arch20',
        opId: record.opId,
        receipt: resA.receipt
      };
    }
    if (resA.conflict) {
      recordDiag({ opId: record.opId, layer: 'A-arch20', committed: false, conflict: true });
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
    // Micropaso 57: if A returned 202 (received by DO, not yet business-committed),
    // do NOT fork the same op onto B — keep it durable with pendingAck:true to reconcile on A!
    if (resA.pendingAck || primaryOnly) {
      lastEffectiveRoute = resA.pendingAck ? 'sync4-a-pending-ack' : 'sync4-c-peer-idb';
      recordDiag({ opId: record.opId, layer: 'A-arch20', committed: false, pendingAck: Boolean(resA.pendingAck), reason: resA.reason });
      return {
        ok: true,
        localDurable: true,
        committed: false,
        pendingAck: Boolean(resA.pendingAck),
        queuedForCatchUp: true,
        blocked: false,
        layer: resA.pendingAck ? 'A-arch20-pending-ack' : 'C-local-peer',
        opId: record.opId,
        fallbackReasons: { A: resA.reason }
      };
    }

    // 2. Fallback B (Independent durable relay reinforcement — strict circuit breaker, byte budget & persistence proof)
    const bGate = canUseFallbackB(payloadBytes);
    let resB = { ok: false, skipped: true, reason: bGate.reason };
    if (bGate.ok) {
      resB = await tryLayer('B-relay', fallbackB, breakerB, record, payloadBytes, true);
      if (resB.ok) {
        lastEffectiveRoute = 'sync4-b-relay';
        await outbox.markCommitted(record.opId, { layer: 'B-relay', receipt: resB.receipt, at: clock() });
        recordDiag({ opId: record.opId, layer: 'B-relay', committed: true, pendingAck: false });
        emit({ type: 'committed', layer: 'B-relay', opId: record.opId });
        return {
          ok: true,
          localDurable: true,
          committed: true,
          pendingAck: false,
          blocked: false,
          layer: 'B-relay',
          opId: record.opId,
          receipt: resB.receipt
        };
      }
    }

    // 3. Fallback C (Peer/local reinforcement — NEVER blocks sales/UI, NEVER fabricates committed:true)
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

    lastEffectiveRoute = 'sync4-c-peer-idb';
    recordDiag({ opId: record.opId, layer: 'C-local-peer', committed: false, pendingAck: Boolean(resB.pendingAck), reasonA: resA.reason, reasonB: resB.reason });
    emit({ type: 'queued-durable', layer: 'C-local-peer', opId: record.opId, reasonA: resA.reason, reasonB: resB.reason });

    return {
      ok: true,
      localDurable: true,
      committed: false,
      pendingAck: Boolean(resB.pendingAck),
      queuedForCatchUp: true,
      blocked: false,
      layer: 'C-local-peer',
      opId: record.opId,
      fallbackReasons: { A: resA.reason, B: resB.reason },
      peerHint: cHint
    };
  }

  function submit({ opId, payload, primaryOnly = false } = {}) {
    if (typeof opId !== 'string' || !OP_ID_RE.test(opId)) {
      return Promise.reject(new TypeError('Sync4 invalid opId'));
    }
    if (!payload || typeof payload !== 'object') {
      return Promise.reject(new TypeError('Sync4 payload object required'));
    }

    const canonicalPayload = canonicalStringify(payload);
    const key = normLicense + '::' + opId;

    const existingFlight = inFlight.get(key);
    if (existingFlight) {
      if (existingFlight.canonicalPayload !== canonicalPayload) {
        const err = new Error(`Sync4 conflicting payload for in-flight opId ${opId}`);
        err.code = 'OPID_PAYLOAD_CONFLICT';
        return Promise.reject(err);
      }
      return existingFlight.promise;
    }

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
          pendingAck: false,
          createdAt: clock()
        });
      }
      return dispatchRecord({ opId, payload, canonicalPayload }, canonicalPayload, { primaryOnly });
    })().finally(() => {
      if (inFlight.get(key)?.promise === promise) inFlight.delete(key);
    });

    inFlight.set(key, { canonicalPayload, promise });
    return promise;
  }

  async function drainPending({ limit = 25, primaryOnly = false } = {}) {
    const pending = await outbox.listPending();
    const slice = pending.slice(0, limit);
    const results = [];
    for (const row of slice) {
      if (breakerA.isOpen() && (primaryOnly || !fallbackB || breakerB.isOpen())) {
        results.push({ opId: row.opId, skipped: true, reason: 'all-remote-circuits-open' });
        break;
      }
      const r = await submit({ opId: row.opId, payload: row.payload, primaryOnly });
      results.push(r);
    }
    return results;
  }

  /**
   * Micropaso 43 & 60: Safe B/C -> A failback barrier.
   * Reconciles every pending / 202-pendingAck opId strictly against Primary A
   * before certifying steady-state A active. Partial ACK leaves remaining ops durable.
   */
  async function reconcileAndFailbackToA({ limit = 100 } = {}) {
    const drained = await drainPending({ limit, primaryOnly: true });
    const remaining = await outbox.listPending();
    const ready = remaining.length === 0 && !breakerA.isOpen();
    if (ready) lastEffectiveRoute = 'sync4-a-2.0';
    return Object.freeze({
      readyForSteadyStateA: ready,
      attempted: drained.length,
      committedNow: drained.filter(r => r.committed === true).length,
      remainingPending: remaining.length,
      remainingOpIds: remaining.map(r => r.opId),
      rutaEfectiva: lastEffectiveRoute
    });
  }

  function status() {
    resetDailyBudgetIfNeeded();
    return {
      engine: 'sync4',
      rutaEfectiva: lastEffectiveRoute,
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

  function diagnostics() {
    return Object.freeze({
      engine: 'sync4',
      licenseCode: normLicense,
      role: normRole,
      rutaEfectiva: lastEffectiveRoute,
      recentOps: recentOps.map(r => Object.freeze({ ...r }))
    });
  }

  return Object.freeze({ submit, drainPending, reconcileAndFailbackToA, status, diagnostics });
}
