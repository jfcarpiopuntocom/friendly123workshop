  function publicarOpLocal(op) {
    if (!op || !op.opId || !API.opsMap) return;
    // C196: no 1.0 opsMap publication while the old transport is paused by
    // an active 2.0 writer. Close the certified writer first; its existing
    // onModeChange resumes the encrypted legacy transport. The durable opId
    // fence must independently authorize the original op before publication.
    function publicarEnLegadoTrasDesarme(mapa, motivo) {
      var coord = API.coordinadorCorte20;
      if (!coord || typeof coord.failbackToLegacy !== "function")
        return Promise.resolve(false);
      return Promise.resolve().then(function () {
        if (API.coordinadorCorte20 !== coord || API.opsMap !== mapa) return null;
        return coord.failbackToLegacy(motivo);
      }).then(async function (res) {
        if (!res || res.mode !== "failback-legacy-1.0" ||
            API.coordinadorCorte20 !== coord || API.opsMap !== mapa ||
            API.modoCorte20Activo === true) return false;
        var autorizado = typeof API.puedeDespacharOpEnLegado === "function"
          ? await API.puedeDespacharOpEnLegado(op.opId) : false;
        if (autorizado !== true || API.coordinadorCorte20 !== coord ||
            API.opsMap !== mapa || API.modoCorte20Activo === true) return false;
        var okLegado = false;
        try { if (!API.opsMap.get(op.opId)) API.opsMap.set(op.opId, op); okLegado = true; }
        catch (_) { okLegado = false; }
        // Sync4 Micropaso 43/60: schedule bounded non-blocking return to Sync4-A after transient failback.
        if (!API.__retornoSync4Timer && (motivo === "typed-command-fallback" || motivo === "unmapped-typed-command")) {
          API.__retornoSync4Timer = setTimeout(function () {
            API.__retornoSync4Timer = null;
            if (document.hidden || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
            var c = API.coordinadorCorte20;
            Promise.resolve(c && typeof c.drainLatchedSameDo === "function" ? c.drainLatchedSameDo() : null)
              .catch(function () {})
              .finally(function () { if (typeof API._reintentarActivarCorte20 === "function") API._reintentarActivarCorte20(); });
          }, 15000);
        }
        return okLegado;
      }).catch(function () { return false; });
    }
    // C31: When the QA-gated 2.0 commercial cutover is active, route supported
    // typed commercial operations to the C25 coordinator instead of 1.0 opsMap.
    if (API.modoCorte20Activo === true && API.coordinadorCorte20 &&
        typeof API.coordinadorCorte20.submitCommercial === "function" &&
        typeof API.traducirOpLegadoAComando20 === "function") {
      var cmd20 = API.traducirOpLegadoAComando20(op);
      if (cmd20) {
        var mapaCorte = API.opsMap;
        Promise.resolve().then(function () {
          return API.despacharOpComercialCertificada(cmd20);
        }).then(function (res) {
          if (!res || res.fallbackLegacy !== true || API.opsMap !== mapaCorte) return;
          return publicarEnLegadoTrasDesarme(mapaCorte, "typed-command-fallback");
        }).catch(function () {});
        return;
      }
      // No typed representation: keeping modoCorte20Activo=true would put
      // the op in an opsMap whose on('update') intentionally suppresses WS.
      void publicarEnLegadoTrasDesarme(API.opsMap, "unmapped-typed-command");
      return;
    }
    // Fail closed if the cutover bit has no live certified coordinator.
    if (API.modoCorte20Activo === true) return;
    // Only the explicitly QA-gated 2.0 pilot performs this extra IDB read.
    // The original 1.0 local-first path remains synchronous when QA is OFF.
    if ((API.coordinadorCorte20 &&
         typeof API.coordinadorCorte20.canDispatchOnLegacy === "function") ||
        API.__port2DurableFenceAvailable === true) {
      var mapaActual = API.opsMap, coordActual = API.coordinadorCorte20;
      Promise.resolve().then(function () {
        return coordActual && typeof coordActual.canDispatchOnLegacy === "function"
          ? coordActual.canDispatchOnLegacy(op.opId)
          : typeof API.puedeDespacharOpEnLegado === "function"
            ? API.puedeDespacharOpEnLegado(op.opId) : false;
      }).then(function (permitidoEnLegado) {
        if (permitidoEnLegado !== true || API.opsMap !== mapaActual ||
            API.coordinadorCorte20 !== coordActual || API.modoCorte20Activo === true) return;
        try { if (!API.opsMap.get(op.opId)) API.opsMap.set(op.opId, op); } catch (_) {}
      }).catch(function () {});
      return;
    }
    try { if (!API.opsMap.get(op.opId)) API.opsMap.set(op.opId, op); } catch (_) {}
  }
