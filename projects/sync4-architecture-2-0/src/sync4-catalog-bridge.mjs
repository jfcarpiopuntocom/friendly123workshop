// Sync4 Live Catalog Delta Bridge — wires local commercial product/rack edits
// to `port2-catalog-delta-writer.mjs::applyDelta()` with STRICT public-field allowlist
// projection (zero costs, zero PINs, zero customer/financial secrets ever enter `-cat`).
//
// If the `-cat` single-writer session is temporarily unavailable (offline / conflict),
// edits NEVER block the Owner's UI: they queue durably under a deterministic opId in
// the Sync4 outbox and replay idempotently on reconnect.

const ID_RE = /^(?!__proto__$)(?!constructor$)(?!prototype$)[A-Za-z0-9_-]{1,120}$/;

// Strict allowlist matching cloudflare-yparty-worker/src/catalog-safe-projection.mjs.
// Explicitly EXCLUDES: costo, margen, proveedor, pin, clientes, ventas, pagos, gastos.
const PUBLIC_PRODUCT_FIELDS = Object.freeze([
  'id', 'nombre', 'sku', 'barcode', 'categoria',
  'precio', 'ubicacionId', 'stockActual', 'fotoHash',
  'archivado', 'borrado', 'chip', 'tipoProducto'
]);

const PUBLIC_SHELF_FIELDS = Object.freeze([
  'id', 'nombre', 'activa', 'orden', 'borrado'
]);

function sanitizeString(v, maxLen = 240) {
  if (typeof v !== 'string') return undefined;
  return v.slice(0, maxLen);
}

function sanitizeFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : undefined;
}

export function projectPublicProductRow(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TypeError('product record required');
  }
  const id = String(raw.id || '').trim();
  if (!ID_RE.test(id)) throw new TypeError(`invalid product id: ${id}`);

  const out = { id };
  for (const field of PUBLIC_PRODUCT_FIELDS) {
    if (field === 'id' || raw[field] === undefined || raw[field] === null) continue;
    const val = raw[field];
    if (field === 'precio' || field === 'stockActual') {
      const num = sanitizeFiniteNumber(val);
      if (num !== undefined) out[field] = num;
    } else if (field === 'archivado' || field === 'borrado') {
      out[field] = Boolean(val);
    } else {
      const s = sanitizeString(String(val));
      if (s !== undefined && s !== '') out[field] = s;
    }
  }
  return Object.freeze(out);
}

export function projectPublicShelfRow(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new TypeError('shelf record required');
  }
  const id = String(raw.id || '').trim();
  if (!ID_RE.test(id)) throw new TypeError(`invalid shelf id: ${id}`);

  const out = { id };
  for (const field of PUBLIC_SHELF_FIELDS) {
    if (field === 'id' || raw[field] === undefined || raw[field] === null) continue;
    const val = raw[field];
    if (field === 'orden') {
      const num = sanitizeFiniteNumber(val);
      if (num !== undefined) out[field] = num;
    } else if (field === 'activa' || field === 'borrado') {
      out[field] = Boolean(val);
    } else {
      const s = sanitizeString(String(val));
      if (s !== undefined && s !== '') out[field] = s;
    }
  }
  return Object.freeze(out);
}

export function createSync4CatalogBridge({
  getWriter,
  sync4Fallback = null,
  onApplied = null
} = {}) {
  if (typeof getWriter !== 'function') {
    throw new TypeError('getWriter callback required');
  }

  async function publishDelta(delta, { opId } = {}) {
    const writer = getWriter();
    if (writer && typeof writer.applyDelta === 'function') {
      try {
        await writer.applyDelta(delta);
        if (typeof onApplied === 'function') onApplied({ mode: 'direct-cat-writer', delta, opId });
        return { ok: true, applied: true, blocked: false, mode: 'direct-cat-writer', delta };
      } catch (err) {
        // Writer unavailable / conflict -> reinforce via Sync4 non-blocking engine, never lose edit!
        if (!sync4Fallback || typeof sync4Fallback.submit !== 'function') {
          return { ok: false, applied: false, blocked: false, reason: err?.message || 'writer-failed', delta };
        }
      }
    }

    if (sync4Fallback && typeof sync4Fallback.submit === 'function') {
      const effectiveOpId = opId || `cat-${delta.kind.replace('.', '-')}-${delta.product?.id || delta.shelf?.id || delta.id}`;
      const res = await sync4Fallback.submit({ opId: effectiveOpId, payload: delta });
      if (typeof onApplied === 'function') onApplied({ mode: 'sync4-fallback', delta, opId: effectiveOpId, res });
      return { ok: true, applied: res.committed === true, queued: res.queuedForCatchUp === true, blocked: false, mode: res.layer, delta, res };
    }

    return { ok: false, applied: false, blocked: false, reason: 'no-writer-or-fallback', delta };
  }

  return Object.freeze({
    upsertProduct(rawProduct, opts) {
      const product = projectPublicProductRow(rawProduct);
      return publishDelta({ kind: 'product.upsert', product }, opts);
    },
    deleteProduct(id, opts) {
      const cleanId = String(id || '').trim();
      if (!ID_RE.test(cleanId)) throw new TypeError(`invalid product id: ${cleanId}`);
      return publishDelta({ kind: 'product.delete', id: cleanId }, opts);
    },
    upsertShelf(rawShelf, opts) {
      const shelf = projectPublicShelfRow(rawShelf);
      return publishDelta({ kind: 'shelf.upsert', shelf }, opts);
    },
    deleteShelf(id, opts) {
      const cleanId = String(id || '').trim();
      if (!ID_RE.test(cleanId)) throw new TypeError(`invalid shelf id: ${cleanId}`);
      return publishDelta({ kind: 'shelf.delete', id: cleanId }, opts);
    }
  });
}
