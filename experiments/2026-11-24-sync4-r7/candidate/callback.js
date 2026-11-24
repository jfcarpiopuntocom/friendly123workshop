        var settlementEpoch = API.__authEpoch20 || 0;
        opciones.onSettled = function (event) {
          if (!coord || API.coordinadorCorte20 !== coord ||
              (API.__authEpoch20 || 0) !== settlementEpoch ||
              (window.OCYjs && window.OCYjs !== API)) return;
          if (!event || typeof event.opId !== "string") return;
          var receipt = event.receipt;
          var committed = event.status === "committed" && receipt &&
            receipt.opId === event.opId && receipt.stage === "business-committed";
          var res = committed
            ? {committed:true,duplicate:event.duplicate===true,receipt:receipt,stage:"business-committed"}
            : {committed:false,quarantine:event.status==="quarantined",reconcileRequired:event.status!=="quarantined",stage:event.status==="quarantined"?"conflict-quarantine":"commit-unverified"};
          _registrarReciboComercial20(event.opId,res);
          if (origOnSettled) origOnSettled(event);
        };
