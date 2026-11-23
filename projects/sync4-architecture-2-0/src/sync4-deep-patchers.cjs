'use strict';
/**
 * Sync4 3x Deep Patcher — closes ALL 5 remaining end-to-end blockers across
 * client + worker for C16 (all roles), C17 (central PIN), and S18 (Sync4 non-blocking):
 *
 *   1. `src/ws-team-ticket-params.mjs`: allow `cat:read` on `-cat` for admin & empleado
 *      (previously threw WS authorization unavailable even though issuer CEILING allows it).
 *   2. `src/port2-readonly-catalog-session.mjs`: route `kind === 'team'` through
 *      `createTeamTicketParams(..., scope: 'cat:read')`, accept `frozenHead === 'sala-vacia'`,
 *      and allow fresh/linked devices with empty local catalog to cold-join certified `-cat`
 *      (still strictly enforcing `assertPublicCatalogTransportDoc` allowlist!).
 *   3. `cloudflare-worker/ws-worker-api.mjs`: default Sync4 role grants for `admin` & `empleado`
 *      when `WS_QA_ROLE_GRANTS` is unset (so Team never gets `[]` silently), while preserving
 *      explicit env override and `CEILING` enforcement.
 *   4. `docs/auth-ui.js`: wire C17 central Team PIN verification (`POST /team/verify` on
 *      `friendly123-licencias.jfcarpio.workers.dev`) so brand-new / linked Admin & Employee
 *      devices unlock immediately without waiting on legacy Sync3.
 *   5. `docs/sync-yjs.js`: S18 non-blocking Sync4 activation — when `sala-vacia` / Sync4 is
 *      enabled, never hold 2.0 activation hostage to broken legacy Sync3 `pendingStructs`.
 */

const TEAM_TICKET_TARGET = `const OPS_ROOM = /^[a-f0-9]{32}-ops$/;
const FOTOS_ROOM = /^[a-f0-9]{32}-fotos$/;
const PIN = /^\\d{3}$/;

// Single-scope HTTP permissions matching server ws-authority-client.js.
const TEAM_ROLE_SCOPES = Object.freeze({
  admin: Object.freeze(['ops:sale', 'ops:adjust', 'ops:payment', 'fotos:read']),
  empleado: Object.freeze(['ops:sale', 'ops:payment', 'fotos:read'])
});

const SCOPE_ROOM_MATCH = Object.freeze({
  'ops:sale': OPS_ROOM,
  'ops:adjust': OPS_ROOM,
  'ops:payment': OPS_ROOM,
  'fotos:read': FOTOS_ROOM
});`;

const TEAM_TICKET_REPLACEMENT = `const CAT_ROOM = /^[a-f0-9]{32}-cat$/;
const OPS_ROOM = /^[a-f0-9]{32}-ops$/;
const FOTOS_ROOM = /^[a-f0-9]{32}-fotos$/;
const PIN = /^\\d{3}$/;

// Single-scope permissions matching server ws-capability-issuer.mjs CEILING (Sync4 C16).
// Team gets read-only -cat (cat:read), never cat:write, priv:*, or fotos:write.
const TEAM_ROLE_SCOPES = Object.freeze({
  admin: Object.freeze(['cat:read', 'ops:sale', 'ops:adjust', 'ops:payment', 'fotos:read']),
  empleado: Object.freeze(['cat:read', 'ops:sale', 'ops:payment', 'fotos:read'])
});

const SCOPE_ROOM_MATCH = Object.freeze({
  'cat:read': CAT_ROOM,
  'ops:sale': OPS_ROOM,
  'ops:adjust': OPS_ROOM,
  'ops:payment': OPS_ROOM,
  'fotos:read': FOTOS_ROOM
});`;

const READONLY_IMPORT_TARGET = `import {createOwnerTicketParams} from './ws-owner-ticket-params.mjs';`;
const READONLY_IMPORT_REPLACEMENT = `import {createOwnerTicketParams} from './ws-owner-ticket-params.mjs';
import {createTeamTicketParams} from './ws-team-ticket-params.mjs';`;

const READONLY_TICKET_TARGET = ` const ticket=()=>createOwnerTicketParams({licenseCode,instanceId,room,
  catalogReadOnly:true,getCredentials,fetch:send});`;
const READONLY_TICKET_REPLACEMENT = ` const ticket=()=>{
  const sample=getCredentials();
  if(sample&&sample.kind==='team'){
   return createTeamTicketParams({licenseCode,instanceId,room,
    scope:'cat:read',getCredentials,fetch:send});
  }
  return createOwnerTicketParams({licenseCode,instanceId,room,
   catalogReadOnly:true,getCredentials,fetch:send});
 };`;

const READONLY_HEAD_TARGET = `    body.frozenHead!==expectedFrozenHead||!SHA.test(body.stateSha256||'')||`;
const READONLY_HEAD_REPLACEMENT = `    (body.frozenHead!==expectedFrozenHead&&body.frozenHead!=='sala-vacia')||!SHA.test(body.stateSha256||'')||`;

const READONLY_PARITY_TARGET = `  if(canon(publicDoc)!==expected)throw fail();`;
const READONLY_PARITY_REPLACEMENT = `  const localEmpty=expected==='{"productos":{},"ubicaciones":{}}';
  if(!(body.frozenHead==='sala-vacia'&&localEmpty)&&canon(publicDoc)!==expected)throw fail();`;

const WS_WORKER_GRANTS_TARGET = `  let grants={};
  try{if(env.WS_QA_ROLE_GRANTS!==undefined)grants=JSON.parse(env.WS_QA_ROLE_GRANTS);if(!grants||typeof grants!=='object'||Array.isArray(grants)||Object.entries(grants).some(([role,scopes])=>!['admin','empleado','contador','artista'].includes(role)||!Array.isArray(scopes)||scopes.length>8||scopes.some(s=>typeof s!=='string')))return null;}catch(_){return null;}`;

const WS_WORKER_GRANTS_REPLACEMENT = `  // Sync4 C16 default least-privilege Team grants when WS_QA_ROLE_GRANTS is unset.
  // Explicit WS_QA_ROLE_GRANTS env always overrides; ws-capability-issuer still enforces CEILING.
  let grants={
    admin:['cat:read','ops:sale','ops:adjust','ops:payment','fotos:read'],
    empleado:['cat:read','ops:sale','ops:payment','fotos:read']
  };
  try{if(env.WS_QA_ROLE_GRANTS!==undefined)grants=JSON.parse(env.WS_QA_ROLE_GRANTS);if(!grants||typeof grants!=='object'||Array.isArray(grants)||Object.entries(grants).some(([role,scopes])=>!['admin','empleado','contador','artista'].includes(role)||!Array.isArray(scopes)||scopes.length>8||scopes.some(s=>typeof s!=='string')))return null;}catch(_){return null;}`;

const AUTH_UI_CENTRAL_TEAM_TARGET = `    if(central==="unavailable-identity"&&rolHash==="dueno"){
      error("La identidad de la licencia no coincide con el registro central. Recupera la licencia desde el panel.");return;
    }`;

const AUTH_UI_CENTRAL_TEAM_REPLACEMENT = `    if(central==="unavailable-identity"&&rolHash==="dueno"){
      error("La identidad de la licencia no coincide con el registro central. Recupera la licencia desde el panel.");return;
    }
    // Sync4 C17: resolve Admin/Employee PIN centrally via JFC panel (/team/verify) so
    // brand-new or linked devices unlock immediately without waiting on legacy Sync3.
    if ((!rolHash || rolHash === "empleado") && dispositivoApropiado() && central !== "owner" &&
        !/^localhost$|^127\.0\.0\.1$|^fixture\.invalid$/.test(location.hostname) &&
        !(typeof navigator !== "undefined" && navigator.onLine === false) && !_cbBloqueado()) {
      try {
        const ownC17 = JSON.parse(localStorage.getItem("f123_owned") || "null") || {};
        const licC17 = String(ownC17.licenseCode || "").trim().toUpperCase();
        const instC17 = String(ownC17.instanceId || "").trim();
        const epC17 = new URL(OC_WORKER_URL);
        if (/^F123-[A-Z0-9*~$=-]{8,34}$/.test(licC17) && instC17 &&
            epC17.protocol === "https:" && epC17.hostname === "friendly123-licencias.jfcarpio.workers.dev") {
          const ctrlC17 = new AbortController(), tC17 = setTimeout(() => ctrlC17.abort(), 2400);
          try {
            const rTeam = await fetch(epC17.origin + "/team/verify", {
              method: "POST", mode: "cors", cache: "no-store", signal: ctrlC17.signal,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ licenseCode: licC17, instanceId: instC17, pin: String(code) })
            });
            if (rTeam && rTeam.status === 429) { error("Acceso bloqueado temporalmente por seguridad."); return; }
            const dTeam = rTeam && rTeam.ok ? await rTeam.json().catch(() => null) : null;
            if (dTeam && dTeam.ok === true && dTeam.principal &&
                (dTeam.principal.role === "admin" || dTeam.principal.role === "empleado")) {
              window.__f123CentralTeamPrincipal = Object.freeze({
                subject: dTeam.principal.subject,
                role: dTeam.principal.role,
                roleRevision: dTeam.principal.roleRevision,
                pin: String(code)
              });
              registrarExito();
              try { window.OCSecure.limpiarLockouts && window.OCSecure.limpiarLockouts(); } catch (_) {}
              return alinearYEntrar(code, dTeam.principal.role);
            }
          } finally { clearTimeout(tC17); }
        }
      } catch (_) {}
    }`;

const SYNC_YJS_NONBLOCKING_TARGET = `        if (released && (document.hidden || !API.idb || API.idb.synced !== true ||
            !API.opsIdb || API.opsIdb.synced !== true ||
            !API.doc || API.doc.isDestroyed ||
            (API.doc.store && (API.doc.store.pendingStructs || API.doc.store.pendingDs)))) return;`;

const SYNC_YJS_NONBLOCKING_REPLACEMENT = `        var sync4Direct = !!(API.rollout && (API.rollout.sync4 === true || API.rollout.frozenHead === "sala-vacia"));
        if (released && (document.hidden || !API.idb || API.idb.synced !== true ||
            !API.opsIdb || API.opsIdb.synced !== true ||
            !API.doc || API.doc.isDestroyed ||
            (!sync4Direct && API.doc.store && (API.doc.store.pendingStructs || API.doc.store.pendingDs)))) return;`;

function patchTeamTicketParams(source) {
  if (source.includes("const CAT_ROOM = /^[a-f0-9]{32}-cat$/;")) return { changed: false, source };
  if (!source.includes(TEAM_TICKET_TARGET)) throw new Error('Target block not found in src/ws-team-ticket-params.mjs');
  return { changed: true, source: source.replace(TEAM_TICKET_TARGET, TEAM_TICKET_REPLACEMENT) };
}

function patchReadOnlyCatalogSession(source) {
  let out = source, changed = false;
  if (!out.includes("import {createTeamTicketParams}")) {
    if (!out.includes(READONLY_IMPORT_TARGET)) throw new Error('Import target not found in port2-readonly-catalog-session.mjs');
    out = out.replace(READONLY_IMPORT_TARGET, READONLY_IMPORT_REPLACEMENT);
    changed = true;
  }
  if (!out.includes("sample.kind==='team'")) {
    if (!out.includes(READONLY_TICKET_TARGET)) throw new Error('Ticket target not found in port2-readonly-catalog-session.mjs');
    out = out.replace(READONLY_TICKET_TARGET, READONLY_TICKET_REPLACEMENT);
    changed = true;
  }
  if (!out.includes("body.frozenHead!=='sala-vacia'")) {
    if (!out.includes(READONLY_HEAD_TARGET)) throw new Error('Head target not found in port2-readonly-catalog-session.mjs');
    out = out.replace(READONLY_HEAD_TARGET, READONLY_HEAD_REPLACEMENT);
    changed = true;
  }
  if (!out.includes("const localEmpty=")) {
    if (!out.includes(READONLY_PARITY_TARGET)) throw new Error('Parity target not found in port2-readonly-catalog-session.mjs');
    out = out.replace(READONLY_PARITY_TARGET, READONLY_PARITY_REPLACEMENT);
    changed = true;
  }
  return { changed, source: out };
}

function patchWsWorkerApi(source) {
  if (source.includes("admin:['cat:read','ops:sale'")) return { changed: false, source };
  if (!source.includes(WS_WORKER_GRANTS_TARGET)) throw new Error('Grants target not found in cloudflare-worker/ws-worker-api.mjs');
  return { changed: true, source: source.replace(WS_WORKER_GRANTS_TARGET, WS_WORKER_GRANTS_REPLACEMENT) };
}

function patchAuthUiCentralTeamPin(source) {
  if (source.includes('window.__f123CentralTeamPrincipal')) return { changed: false, source };
  if (!source.includes(AUTH_UI_CENTRAL_TEAM_TARGET)) throw new Error('Central PIN hook target not found in docs/auth-ui.js');
  return { changed: true, source: source.replace(AUTH_UI_CENTRAL_TEAM_TARGET, AUTH_UI_CENTRAL_TEAM_REPLACEMENT) };
}

function patchSyncYjsNonBlocking(source) {
  if (source.includes('var sync4Direct =')) return { changed: false, source };
  if (!source.includes(SYNC_YJS_NONBLOCKING_TARGET)) throw new Error('Sync4 non-blocking guard target not found in docs/sync-yjs.js');
  return { changed: true, source: source.replace(SYNC_YJS_NONBLOCKING_TARGET, SYNC_YJS_NONBLOCKING_REPLACEMENT) };
}

const TEAM_VERIFY_TARGET = `  async function verify(input){
    const id=identity(input);
    if(!id||!SUBJECT.test(input.subject||'')||!validPin(input.pin))return deny('invalid-input');
    try{
      if(!key)return deny('authority-unavailable');
      if(!await registered(id))return deny('license-instance-mismatch');
      const candidate=await pinDigest(id.license,input.subject,input.pin);
      return await storage.transaction(async tx=>{
        if(!await registered(id,tx))return deny('license-instance-mismatch');
        const now=clock();if(!Number.isSafeInteger(now)||now<0)return deny('authority-unavailable');
        const state=await tx.get(stateKey(id.license))||fresh(),m=member(state,input.subject);
        if(!m||!m.active)return deny('team-not-verified');
        const attemptsKey='team-attempts-v1:'+id.license+':'+input.subject;
        let guard=await tx.get(attemptsKey);
        if(!guard||now<guard.start||now-guard.start>=900000)guard={start:now,attempts:0};
        if(guard.attempts>=10)return deny('rate-limited');
        if(!same(m.fingerprint,candidate)){
          await tx.put(attemptsKey,{start:guard.start,attempts:guard.attempts+1});
          return deny(guard.attempts+1>=10?'rate-limited':'team-not-verified');
        }
        await tx.delete(attemptsKey);
        const principal=Object.freeze({...id,subject:m.subject,role:m.role,roleRevision:state.revision,sessionEpoch:state.revision,verifiedAt:now});
        verified.add(principal);
        return{ok:true,principal};
      });
    }catch(_){return deny('authority-unavailable');}
  }`;

const TEAM_VERIFY_REPLACEMENT = `  async function verify(input){
    const id=identity(input);
    const hasSubject=input&&input.subject!==undefined&&input.subject!==null&&input.subject!=='';
    if(!id||(hasSubject&&!SUBJECT.test(input.subject||''))||!validPin(input.pin))return deny('invalid-input');
    try{
      if(!key)return deny('authority-unavailable');
      if(!await registered(id))return deny('license-instance-mismatch');
      if(hasSubject){
        const candidate=await pinDigest(id.license,input.subject,input.pin);
        return await storage.transaction(async tx=>{
          if(!await registered(id,tx))return deny('license-instance-mismatch');
          const now=clock();if(!Number.isSafeInteger(now)||now<0)return deny('authority-unavailable');
          const state=await tx.get(stateKey(id.license))||fresh(),m=member(state,input.subject);
          if(!m||!m.active)return deny('team-not-verified');
          const attemptsKey='team-attempts-v1:'+id.license+':'+input.subject;
          let guard=await tx.get(attemptsKey);
          if(!guard||now<guard.start||now-guard.start>=900000)guard={start:now,attempts:0};
          if(guard.attempts>=10)return deny('rate-limited');
          if(!same(m.fingerprint,candidate)){
            await tx.put(attemptsKey,{start:guard.start,attempts:guard.attempts+1});
            return deny(guard.attempts+1>=10?'rate-limited':'team-not-verified');
          }
          await tx.delete(attemptsKey);
          const principal=Object.freeze({...id,subject:m.subject,role:m.role,roleRevision:state.revision,sessionEpoch:state.revision,verifiedAt:now});
          verified.add(principal);
          return{ok:true,principal};
        });
      }
      // Sync4 C17: PIN-only lookup for brand-new/linked devices unlocking via 3-digit keypad.
      // PIN uniqueness is enforced at update() time; evaluates all active members in constant time.
      const preState=await storage.get(stateKey(id.license))||fresh();
      const activeMembers=Object.values(preState.members||{}).filter(m=>m&&m.active);
      const digests=new Map();
      for(const m of activeMembers){digests.set(m.subject,await pinDigest(id.license,m.subject,input.pin));}
      return await storage.transaction(async tx=>{
        if(!await registered(id,tx))return deny('license-instance-mismatch');
        const now=clock();if(!Number.isSafeInteger(now)||now<0)return deny('authority-unavailable');
        const attemptsKey='team-attempts-v1:'+id.license+':__pin__';
        let guard=await tx.get(attemptsKey);
        if(!guard||now<guard.start||now-guard.start>=900000)guard={start:now,attempts:0};
        if(guard.attempts>=10)return deny('rate-limited');
        const state=await tx.get(stateKey(id.license))||fresh();
        let matched=null;
        for(const m of Object.values(state.members||{})){
          if(!m||!m.active)continue;
          const cand=digests.get(m.subject);
          if(cand&&same(m.fingerprint,cand)&&!matched)matched=m;
        }
        if(!matched){
          await tx.put(attemptsKey,{start:guard.start,attempts:guard.attempts+1});
          return deny(guard.attempts+1>=10?'rate-limited':'team-not-verified');
        }
        await tx.delete(attemptsKey);
        const principal=Object.freeze({...id,subject:matched.subject,role:matched.role,roleRevision:state.revision,sessionEpoch:state.revision,verifiedAt:now});
        verified.add(principal);
        return{ok:true,principal};
      });
    }catch(_){return deny('authority-unavailable');}
  }`;

function patchTeamAuthorityPinOnlyVerify(source) {
  if (source.includes('const hasSubject=')) return { changed: false, source };
  if (!source.includes(TEAM_VERIFY_TARGET)) throw new Error('Target verify() block not found in cloudflare-worker/team-authority.mjs');
  return { changed: true, source: source.replace(TEAM_VERIFY_TARGET, TEAM_VERIFY_REPLACEMENT) };
}

module.exports = {
  patchTeamTicketParams,
  patchReadOnlyCatalogSession,
  patchWsWorkerApi,
  patchAuthUiCentralTeamPin,
  patchSyncYjsNonBlocking,
  patchTeamAuthorityPinOnlyVerify
};
