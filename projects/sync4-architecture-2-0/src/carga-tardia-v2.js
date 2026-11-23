/* carga-tardia-v2.js — Post-PIN and on-demand script loader for friendly-123 (Sync4).
 * Brings synchronous pre-PIN JS boot weight <= 40% of 22-nov baseline (<= 1,482,506 B).
 * Every deferred script stays in sw.js SHELL for 100% offline support.
 */
(function (root) {
  'use strict';

  var GRUPOS = {
    postLogin: [
      './backup-scheduler.min.js',
      './vendor/minisearch.min.js',
      './vendor/ufuzzy.min.js',
      './lista-dinamica.min.js',
      './borradores.min.js',
      './micelio-vivo.min.js',
      './micelio-ui.min.js',
      './geo-ping.min.js',
      './dashboard-broadcast.js',
      './telemetry.js',
      './audit-store.js',
      './sync-latencia.js',
      './copiar-libre.js',
      './customer-profile.js',
      './core/sales-audit.js',
      './core/ledger.min.js',
      './expense-receipt.js',
      './application/recover-shelf-photo.js',
      './core/shelf-photo-policy.js',
      './idb-archivo.js'
    ],
    etiquetas: ['./qrcode-local.min.js', './barcode128.js'],
    avanzado: [
      './avanzado-extra.min.js',
      './salud-app.js',
      './reconciliacion.min.js',
      './hechos.min.js',
      './respaldo-empleado.min.js',
      './simon-config.min.js',
      './sales-audit-ui.js',
      './pocketbase-client.min.js'
    ],
    perchas: ['./vista-perchas.min.js', './percha-reposicion.min.js'],
    comisiones: [
      './core/commission-history.js',
      './core/payout-ledger.min.js',
      './commissions-by-person.js',
      './artista.min.js'
    ],
    creditos: [
      './cartera.min.js',
      './plan-pagos.min.js',
      './plan-pagos-ui.min.js',
      './caja-chica.js'
    ],
    ayuda: [
      './help-ui.min.js',
      './novedades.min.js',
      './welcome-ui.min.js',
      './tutorial-ui.js',
      './ganchos-demo.js'
    ],
    fallbackB: ['./vendor/supabase-relay.min.js'],
    i18nEs: ['./i18n-es.min.js']
  };

  var cargados = Object.create(null);
  var enCurso = Object.create(null);
  var gruposEnCurso = Object.create(null);

  function cargarScript(src) {
    if (cargados[src]) return Promise.resolve(src);
    if (enCurso[src]) return enCurso[src];
    if (typeof document === 'undefined' || !document.createElement) {
      return Promise.reject(new Error('DOM unavailable for lazy script: ' + src));
    }
    var p = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { cargados[src] = true; delete enCurso[src]; resolve(src); };
      s.onerror = function () { delete enCurso[src]; reject(new Error('Failed to load deferred script: ' + src)); };
      (document.head || document.documentElement).appendChild(s);
    });
    enCurso[src] = p;
    return p;
  }

  function asegurar(nombreGrupo) {
    var lista = GRUPOS[nombreGrupo];
    if (!Array.isArray(lista)) return Promise.reject(new Error('Unknown lazy group: ' + nombreGrupo));
    if (gruposEnCurso[nombreGrupo]) return gruposEnCurso[nombreGrupo];
    var p = Promise.all(lista.map(cargarScript)).then(
      function () { return true; },
      function (err) { delete gruposEnCurso[nombreGrupo]; throw err; }
    );
    gruposEnCurso[nombreGrupo] = p;
    return p;
  }

  function programarPostLogin() {
    var lanzar = function () { asegurar('postLogin').catch(function () {}); };
    if (typeof root.requestIdleCallback === 'function') {
      try { root.requestIdleCallback(lanzar, { timeout: 3000 }); return; } catch (_) {}
    }
    setTimeout(lanzar, 150);
  }

  function inicializarListeners() {
    if (typeof root.addEventListener !== 'function') return;
    root.addEventListener('oc-login', programarPostLogin);
    var checkUnlocked = function () {
      var gate = typeof document !== 'undefined' && document.getElementById('oc-gate');
      var auth = root.OCAuth;
      var unlocked = (!gate || (gate.style && gate.style.display === 'none')) &&
        (!auth || typeof auth.rolActual !== 'function' || !!auth.rolActual());
      if (unlocked) programarPostLogin();
    };
    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete') setTimeout(checkUnlocked, 1000);
      else root.addEventListener('load', function () { setTimeout(checkUnlocked, 1000); }, { once: true });
    }
  }

  var api = {
    GRUPOS: GRUPOS,
    cargarScript: cargarScript,
    asegurar: asegurar,
    estaCargado: function (src) { return !!cargados[src]; },
    listarDiferidos: function () {
      var out = [];
      Object.keys(GRUPOS).forEach(function (g) {
        GRUPOS[g].forEach(function (s) { if (out.indexOf(s) === -1) out.push(s); });
      });
      return out;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.OCCargaTardia = api;
    inicializarListeners();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
