        const _opVenta = { productoId: p.id, delta: -cant, opId: opIdVenta };
        // C34 PORT2: The old stock fact carries ONLY delta. C31's certified
        // sale.record needs exact paid quantity/cents from the locally DURABLE
        // sale, not a guessed monetary amount from stock. Only explicit full
        // CASH, list-price, non-credit/non-courtesy, non-deficit sales qualify.
        // All other sales retain their original legacy stock event and never
        // invent business-committed cash on the typed DO.
        // Typed 2.0 sale.record has no effective-date contract. The legacy
        // stock/catalog path preserves the historical sale without misdating cash.
        const _metodo20 = String(infoVenta.formaPago || "").trim().toLowerCase();
        const _unit20 = Math.round(precioEfectivo * 100);
        const _total20 = Math.round(montoBruto * 100);
        if (!infoVenta.fechaVenta && (_metodo20 === "cash" || _metodo20 === "efectivo") &&
            !_esCortesia && infoVenta.fiadoAtomico !== true &&
            (infoVenta.montoPagado === null ||
              (Number.isFinite(infoVenta.montoPagado) && Math.round(infoVenta.montoPagado * 100) === _total20)) &&
            Number.isSafeInteger(cant) && cant >= 1 && cant <= 10000 &&
            Number.isSafeInteger(_unit20) && _unit20 > 0 &&
            Number.isSafeInteger(_total20) && _total20 === _unit20 * cant &&
            _total20 <= 10000000000 &&
            Number.isFinite(p.precio) && Math.round(p.precio * 100) === _unit20 &&
            Number.isFinite(p.stockActual) && p.stockActual >= 0 &&
            // C36: a typed business command must use the SAME stable opId as
            // the locally committed sale. Existing legacy IDs with ':' or '.'
            // remain valid for local receipts but must not be sent as C15 SQL.
            /^[A-Za-z0-9_-]{8,96}$/.test(opIdVenta)) {
          _opVenta.cantidad = cant;
          _opVenta.amountCents = _total20;
          _opVenta.opId = opIdVenta;
        }
