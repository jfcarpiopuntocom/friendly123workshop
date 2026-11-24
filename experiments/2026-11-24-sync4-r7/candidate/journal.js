  function leerTerminales20Set(yjs) {
    const out = new Set();
    try {
      const list = yjs && typeof yjs.opIdsTerminales20 === "function" ? yjs.opIdsTerminales20() : null;
      if (Array.isArray(list)) {
        for (const id of list) {
          if (typeof id === "string" && id.trim()) out.add(id.trim());
        }
      }
    } catch (_) {}
    return out;
  }
  function podarPendientesYjs(licencia, yjs) {
    if (_podaEnCurso || Date.now() - _ultimaPoda < PODA_DIARIO_MIN_MS) return;
    const idb = yjs.opsIdb;
    if (!idb || !idb.db) return; // not open yet (or no IDB at all): no proof possible, keep everything
    _podaEnCurso = true; _ultimaPoda = Date.now();
    leerOpIdsDurablesYjs(yjs).then(function (durables) {
      _podaEnCurso = false;
      if (!durables || !durables.size) return;
      // The readback is asynchronous: the active licence or Y.Doc may have
      // switched meanwhile. The proof is valid only for the same licence AND
      // the same persistence object it was read from.
      const ahora = window.OCYjs;
      if (codigoCuadernoActivo() !== licencia || !ahora || ahora.opsIdb !== idb ||
          ahora.codigoCuaderno !== licencia) return;
      // Re-read NOW: OCSyncEmit may have appended while IDB was reading. Only
      // entries of this licence whose opId was read back from IDB or confirmed
      // settled in DO (settled_ops) are removed; anything else stays.
      const actuales = leerPendientesYjs(licencia);
      if (!actuales) return; // corrupt journal: never rewrite it
      const quedan = actuales.filter(function (op) {
        if (!op || !op.opId || normalizarCodigo(op._salaOrigen) !== licencia) return true;
        return !durables.has(op.opId);
      });
      // A failed write leaves the old (larger) journal: replays are idempotent by opId.
      if (quedan.length !== actuales.length) guardarPendientesYjs(licencia, quedan);
    }, function () { _podaEnCurso = false; });
  }
  function drenarPendientesYjs() {
    const licencia = codigoCuadernoActivo();
    const yjs = window.OCYjs;
    if (!licencia || !yjs || yjs.estado !== "activo" ||
        !yjs.opsMap || yjs.codigoCuaderno !== licencia) return;
    const ops = leerPendientesYjs(licencia);
    if (!ops || !ops.length) return;
    const terminales20 = leerTerminales20Set(yjs);
    // Never remove a locally durable op merely because Yjs has it in RAM.
    // IndexedDB persistence is asynchronous; opsMap.get is NOT a durable ACK.
    // Keep the journal across reloads, and replay only entries missing from
    // the active same-licence Y.Doc. Removal happens ONLY in podarPendientesYjs,
    // after the op was read back from the ops Y.Doc's IndexedDB (v766) or
    // confirmed settled in 2.0 settled_ops.
    let enDoc = false;
    let enTerminales20 = false;
    for (const op of ops) {
      if (!op || normalizarCodigo(op._salaOrigen) !== licencia) continue;
      if (op.opId && terminales20.has(op.opId)) {
        enTerminales20 = true;
        continue;
      }
      try {
        if (!yjs.opsMap.get(op.opId))
          window.dispatchEvent(new CustomEvent("oc-op-local", { detail: op }));
        if (yjs.opsMap.get(op.opId)) enDoc = true;
      } catch (_) {} // the durable journal is retained for another retry
    }
    if (enDoc) podarPendientesYjs(licencia, yjs);
  }
