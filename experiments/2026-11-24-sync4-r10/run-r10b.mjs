// R10b: node run-r10b.mjs. Exact source fragments + deterministic barriers.
function original(env) {
  const {ready,isVisible,entries,inFlight,clearTimer,runAttempt,maxAttempts}=env;
  let destroyed=false,paused=false;
  function trackFlight(opId, payloadKey, fn) {
    const promise = (async () => {
      try {
        return await fn();
      } finally {
        inFlight.delete(opId);
      }
    })();
    inFlight.set(opId, { payloadKey, promise });
    return promise;
  }
  async function reconcileNow() {
    if (destroyed) return Object.freeze({ attempted: 0, results: Object.freeze([]), stage: 'reconciler-destroyed' });
    try { await ready(); }
    catch (_) { return Object.freeze({attempted:0,results:Object.freeze([]),stage:'durable-store-unavailable'}); }
    if (destroyed || paused || !isVisible()) {
      return Object.freeze({ attempted: 0, results: Object.freeze([]) });
    }
    const candidates = Array.from(entries.values()).filter(
      e => e.state !== 'quarantined' && !inFlight.has(e.opId)
    );
    const results = [];
    for (const entry of candidates) {
      if (destroyed || paused || !isVisible()) break;
      clearTimer(entry.opId);
      if (entry.state === 'paused-retry-exhausted' || entry.attempts >= Math.min(maxAttempts, 10)) {
        entry.attempts = 0;
      }
      entry.state = 'pending';
      results.push(await trackFlight(entry.opId, entry.payloadKey, () => runAttempt(entry.command, entry, false)));
    }
    return Object.freeze({ attempted: results.length, results: Object.freeze(results) });
  }
  return {trackFlight,reconcileNow};
}
function candidate(env) {
  const {ready,isVisible,entries,inFlight,clearTimer,runAttempt,maxAttempts}=env;
  let destroyed=false,paused=false;
  const flightVersions = new WeakMap();
  function trackFlight(opId, payloadKey, fn) {
    const current = entries.get(opId);
    if (current) flightVersions.set(current, {});
    const promise = (async () => {
      try {
        return await fn();
      } finally {
        inFlight.delete(opId);
      }
    })();
    inFlight.set(opId, { payloadKey, promise });
    return promise;
  }
  async function reconcileNow() {
    if (destroyed) return Object.freeze({ attempted: 0, results: Object.freeze([]), stage: 'reconciler-destroyed' });
    try { await ready(); }
    catch (_) { return Object.freeze({attempted:0,results:Object.freeze([]),stage:'durable-store-unavailable'}); }
    if (destroyed || paused || !isVisible()) {
      return Object.freeze({ attempted: 0, results: Object.freeze([]) });
    }
    const candidates = Array.from(entries.values()).filter(
      e => e.state !== 'quarantined' && !inFlight.has(e.opId)
    ).map(entry => ({ entry, flightVersion: flightVersions.get(entry) }));
    const results = [];
    for (const { entry, flightVersion } of candidates) {
      if (destroyed || paused || !isVisible()) break;
      if (entries.get(entry.opId) !== entry || inFlight.has(entry.opId) ||
          entry.state === 'quarantined' || flightVersions.get(entry) !== flightVersion) continue;
      clearTimer(entry.opId);
      if (entry.state === 'paused-retry-exhausted' || entry.attempts >= Math.min(maxAttempts, 10)) {
        entry.attempts = 0;
      }
      entry.state = 'pending';
      results.push(await trackFlight(entry.opId, entry.payloadKey, () => runAttempt(entry.command, entry, false)));
    }
    return Object.freeze({ attempted: results.length, results: Object.freeze(results) });
  }
  return {trackFlight,reconcileNow};
}
function defer(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
async function exercise(factory,kind,reverse=false) {
 const a=reverse?"sale-second":"sale-first",b=reverse?"sale-first":"sale-second";
 const mk=opId=>({opId,command:{opId},payloadKey:opId,state:"pending",attempts:1});
 const entries=new Map([[a,mk(a)],[b,mk(b)]]),inFlight=new Map(),calls=[],cleared=[];
 const firstStarted=defer(),firstRelease=defer(),secondStarted=defer(),secondRelease=defer();
 let visible=true,scheduled=false;
 const runAttempt=async(command,entry)=>{
   calls.push(command.opId);
   if(command.opId===a){firstStarted.resolve();await firstRelease.promise;entries.delete(a);return "committed";}
   if(calls.filter(id=>id===b).length===1){
     secondStarted.resolve();
     if(kind==="inflight")await secondRelease.promise;
     if(kind==="quarantine")entry.state="quarantined";
     else if(kind==="replacement")entries.set(b,mk(b));
     else if(kind==="pending"||kind==="retry-later"){entry.state="pending";scheduled=true;}
     else entries.delete(b);
   } else entries.delete(b);
   return "done";
 };
 const env={ready:async()=>true,isVisible:()=>visible,entries,inFlight,maxAttempts:5,clearTimer:id=>{cleared.push(id);if(id===b)scheduled=false;},runAttempt};
 const {reconcileNow:drain,trackFlight}=factory(env);
 const p1=drain();await firstStarted.promise;
 if(kind==="serial"){firstRelease.resolve();await p1;return {pass:calls.length===2&&entries.size===0,calls,cleared};}
 if(kind==="hidden"){visible=false;firstRelease.resolve();await p1;return {pass:calls.length===1&&entries.has(b),calls,cleared};}
 const p2=kind==="external"?trackFlight(b,b,()=>runAttempt(entries.get(b).command,entries.get(b))):drain();
 await secondStarted.promise;
 if(kind!=="inflight")await p2;
 firstRelease.resolve();await p1;
 if(kind==="inflight"){secondRelease.resolve();await p2;}
 const before=calls.filter(x=>x===b).length;
 const valid=before===1&&cleared.filter(x=>x===b).length===(kind==="external"?0:1)&&(kind!=="quarantine"||entries.get(b)?.state==="quarantined")&&(kind!=="replacement"||entries.has(b))&&(!["pending","retry-later"].includes(kind)||(entries.has(b)&&scheduled));
 if(kind==="retry-later"){await drain();return {pass:valid&&calls.filter(x=>x===b).length===2&&entries.size===0,calls,cleared};}
 return {pass:valid,calls,cleared,remaining:[...entries.keys()],scheduled};
}
const cases=[["settled",false],["settled",true],["inflight",false],["quarantine",false],["replacement",false],["pending",false],["external",false],["retry-later",false],["serial",false],["hidden",false]];
const results=[];for(const [kind,rev] of cases)results.push({case:kind,reverse:rev,baseline:await exercise(original,kind,rev),candidate:await exercise(candidate,kind,rev)});
console.log(JSON.stringify(results,null,2));
if(results.filter(r=>r.baseline.pass).length!==2||results.filter(r=>r.candidate.pass).length!==10)process.exitCode=1;
