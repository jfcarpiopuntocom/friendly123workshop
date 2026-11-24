    function _opIdAjusteOAbonoDurable(t, p) {
      if (!p || typeof p.opId !== "string") return uuidCorto();
      if (t === "ajuste") {
        return /^[A-Za-z0-9_-]{8,96}$/.test(p.opId) &&
          typeof p.productoId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(p.productoId.trim()) &&
          Number.isSafeInteger(p.stockNuevo) && p.stockNuevo >= 0
          ? p.opId : uuidCorto();
      }
      if (t === "abono") {
        if (!Number.isSafeInteger(p.amountCents) || p.amountCents <= 0) return uuidCorto();
        if (/^customer-payment:[A-Za-z0-9_-]{8,79}$/.test(p.opId) &&
            typeof p.clienteId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(p.clienteId.trim())) {
          return p.opId;
        }
        if (/^[A-Za-z0-9_-]{8,96}$/.test(p.opId) &&
            typeof p.receivableId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(p.receivableId.trim())) {
          return p.opId;
        }
      }
      return uuidCorto();
    }
    const opIdVentaDurable = tipo === "venta" && payload &&
      typeof payload.opId === "string" &&
      /^[A-Za-z0-9_-]{8,96}$/.test(payload.opId) &&
      Number.isSafeInteger(payload.cantidad) && payload.cantidad >= 1 &&
      Number.isSafeInteger(payload.amountCents) && payload.amountCents > 0
      ? payload.opId : (tipo === "venta" && payload &&
        typeof payload.legacyOpId === "string" &&
        /^[A-Za-z0-9_-]{8,96}$/.test(payload.legacyOpId)
        ? payload.legacyOpId : _opIdAjusteOAbonoDurable(tipo, payload));
