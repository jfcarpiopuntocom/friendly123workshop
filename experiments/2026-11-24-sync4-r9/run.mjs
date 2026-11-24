const fragments={"journal":"  const COLA_YJS_SIN_SALA = \"f123_yjs_ops_pendientes_v1_\";\n  /* v766 (v0.7.66) — PARSE CACHE. drenarPendientesYjs runs every 2 s; before\n     v766 it re-parsed the WHOLE journal each tick. Now the parsed array is kept\n     together with the exact raw string it came from and is reused only while\n     localStorage still holds that same string (same licence). Any change by\n     this tab, another tab or a reload produces a different string, so it is\n     parsed again: the cache can never hide a new or removed op. A corrupt value\n     throws before the cache is updated, so it is still reported as null\n     (corrupt is NOT empty). Callers get a COPY of the array: OCSyncEmit pushes\n     into it and must not mutate the cached one. To revert: delete\n     _diarioCache and the two lines that use it. */\n  let _diarioCache = { licencia: \"\", raw: null, ops: null };\n  function leerPendientesYjs(licencia) {\n    try {\n      const raw = localStorage.getItem(COLA_YJS_SIN_SALA + licencia);\n      if (raw === null || raw === undefined || raw === \"\") {\n        _diarioCache = { licencia, raw, ops: [] };\n        return [];\n      }\n      if (_diarioCache.ops && _diarioCache.licencia === licencia && _diarioCache.raw === raw) return _diarioCache.ops.slice();\n      const arr = JSON.parse(raw);\n      if (!Array.isArray(arr)) return null;\n      const ops = arr;\n      _diarioCache = { licencia: licencia, raw: raw, ops: ops };\n      return ops.slice();\n    } catch (_) { return null; } // corrupt/unreadable is NOT an empty journal\n  }\n  function guardarPendientesYjs(licencia, ops) {\n    try {\n      const raw = JSON.stringify(ops);\n      localStorage.setItem(COLA_YJS_SIN_SALA + licencia, raw);\n      _diarioCache = { licencia: licencia, raw: raw, ops: ops.slice() };\n      return true;\n    }\n    catch (_) { return false; } // never silently trim or claim an ACK\n  }\n\n","append":"      const pendientes = leerPendientesYjs(licencia);\n      if (!pendientes) return false;\n      pendientes.push(op);\n      if (!guardarPendientesYjs(licencia, pendientes)) return false;\n","proof":"  function esReciboVerificado20(yjs, op, licencia) {\n    try {\n      if (!yjs || !op || !op.opId || !yjs.recibosComerciales20 ||\n          typeof yjs.recibosComerciales20.get !== \"function\") return false;\n      const entry = yjs.recibosComerciales20.get(op.opId);\n      if (!entry || entry.committed !== true || entry.stage !== \"business-committed\") return false;\n      const receipt = entry.receipt;\n      if (!receipt || typeof receipt !== \"object\" ||\n          String(receipt.opId || \"\").trim() !== String(op.opId).trim() ||\n          receipt.stage !== \"business-committed\") return false;\n      if (receipt.license && normalizarCodigo(receipt.license) !== licencia) return false;\n      return true;\n    } catch (_) { return false; }\n  }\n"};
const experiment=function experiment(f){
const candidate=`
const PREFIX="f123_yjs_ops_pendientes_v2_";
function prefix(licencia){return PREFIX+encodeURIComponent(licencia)+"/";}
function append(licencia,op){
  try {
    if (!op || !op.opId || op._salaOrigen!==licencia) return false;
    const key=prefix(licencia)+recordId();
    // physical record identifier is separate from the commercial opId
    if(localStorage.getItem(key)!==null)return false;
    localStorage.setItem(key,JSON.stringify(op));
    return true;
  }catch(_){return false;}
}
function snapshot(licencia){
  try{
    const old=localStorage.getItem(COLA_YJS_SIN_SALA+licencia);
    const legacy=old===null?[]:JSON.parse(old);
    if(!Array.isArray(legacy))return null;
    const keys=new Set();
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key&&key.startsWith(prefix(licencia)))keys.add(key);
    }
    const records=[];
    for(const key of keys){
      const raw=localStorage.getItem(key);
      if(raw===null)continue;
      const op=JSON.parse(raw);
      if(!op||!op.opId||op._salaOrigen!==licencia)return null;
      records.push({key,raw,op});
    }
    return {legacy,records};
  }catch(_){return null;}
}
function prune(snapshot,proven){
  // v1 array is read-only until migration/quiescence is established.
  if(!snapshot)return;
  for(const row of snapshot.records){
    if(proven(row.op)&&localStorage.getItem(row.key)===row.raw)localStorage.removeItem(row.key);
  }
}
`;
const make=(localStorage,recordId)=>new Function("localStorage","recordId",f.journal+candidate+"\nreturn {append,snapshot,prune,oldAppend:function(licencia,op){"+f.append+"return true;},oldRead:leerPendientesYjs,oldWrite:guardarPendientesYjs};")(localStorage,recordId);
function storage(){const m=new Map();let hook=null,fail=false;const api={get length(){return m.size},key:i=>[...m.keys()][i]??null,getItem(k){const v=m.get(k)??null;if(hook){const h=hook;hook=null;h(k)}return v},setItem(k,v){if(fail)throw Error("quota");m.set(k,v)},removeItem:k=>m.delete(k)};return {api,m,setHook:h=>hook=h,fail:()=>fail=true}}
const a={opId:"sale-a-001",_salaOrigen:"LAB",payload:{amountCents:1500}},b={opId:"sale-b-001",_salaOrigen:"LAB",payload:{amountCents:3500}},legacyKey="f123_yjs_ops_pendientes_v1_LAB";
const proof=new Function("normalizarCodigo",f.proof+"\nreturn esReciboVerificado20")(s=>s);
const oldProof=(receipt,op)=>proof({recibosComerciales20:new Map([[op.opId,{committed:true,stage:"business-committed",receipt}]])},op,"LAB");
const results=[];
function add(name,base,cand){results.push({name,baseline:base,candidate:cand})}
{let f=storage(),x=make(f.api,()=>"x"),y=make(f.api,()=>"y");let r2;f.setHook(()=>{r2=y.oldAppend("LAB",b)});let r1=x.oldAppend("LAB",a);let old=x.oldRead("LAB");let g=storage(),u=make(g.api,()=>"x"),v=make(g.api,()=>"y");let s2;g.setHook(()=>{s2=v.append("LAB",b)});let s1=u.append("LAB",a);let records=u.snapshot("LAB").records;add("two concurrent appends both return true and both survive",{pass:r1&&r2&&old.length===2,count:old.length},{pass:s1&&s2&&records.length===2,count:records.length})}
{let f=storage(),x=make(f.api,()=>"x"),y=make(f.api,()=>"y");x.oldAppend("LAB",a);let snapshot=x.oldRead("LAB");y.oldAppend("LAB",b);x.oldWrite("LAB",snapshot.filter(o=>o.opId!==a.opId));let g=storage(),u=make(g.api,()=>"x"),v=make(g.api,()=>"y");u.append("LAB",a);let snap=u.snapshot("LAB");v.append("LAB",b);u.prune(snap,o=>o.opId===a.opId);let old=x.oldRead("LAB"),records=u.snapshot("LAB").records;add("pruning stale snapshot preserves concurrent append",{pass:old.some(o=>o.opId===b.opId),count:old.length},{pass:records.length===1&&records[0].op.opId===b.opId,count:records.length})}
{let f=storage(),x=make(f.api,()=>"x"),y=make(f.api,()=>"y");f.fail();let a1=x.oldAppend("LAB",a),a2=y.append("LAB",a);add("quota failure reports false",{pass:!a1,count:f.m.size},{pass:!a2,count:f.m.size})}
{let f=storage(),x=make(f.api,()=>"x"),y=make(f.api,()=>"y");f.api.setItem(legacyKey,JSON.stringify([a]));x.append("LAB",b);const snapshot=y.snapshot("LAB");add("reload reads v1 plus v2 without rewriting legacy",{pass:false,notApplicable:"baseline has no v2"},{pass:snapshot.legacy.length===1&&snapshot.records.length===1&&f.api.getItem(legacyKey)===JSON.stringify([a])})}
{let f=storage(),x=make(f.api,()=>"x"),y=make(f.api,()=>"y");x.append("LAB",a);y.append("LAB2",{...b,_salaOrigen:"LAB2"});add("licence isolation",{pass:true,control:true},{pass:x.snapshot("LAB").records.length===1&&x.snapshot("LAB2").records.length===1})}
{let f=storage(),x=make(f.api,()=>"x"),y=make(f.api,()=>"y");x.append("LAB",a);y.append("LAB",{...a,payload:{amountCents:9999}});const records=x.snapshot("LAB").records;add("distinct same-opId payloads preserved for conflict handling",{pass:true,control:"v1 sequential append also preserves both"},{pass:records.length===2&&records[0].op.payload.amountCents!==records[1].op.payload.amountCents})}
{let f=storage(),x=make(f.api,()=>"x");f.api.setItem(legacyKey,"{broken");x.append("LAB",a);add("malformed legacy bytes retained and read fails closed",{pass:x.oldRead("LAB")===null},{pass:x.snapshot("LAB")===null&&f.api.getItem(legacyKey)==="{broken"&&f.m.size===2})}
const receipt={opId:a.opId,stage:"business-committed",license:"LAB",receiptId:"original-receipt"};
const residual=[{name:"different payload same opId still qualifies for pruning",observed:oldProof(receipt,{...a,payload:{amountCents:9999}})},{name:"receipt without licence still qualifies",observed:oldProof({...receipt,license:undefined},a)}];
return {results,residual,candidate};
};
const r=experiment(fragments);console.log(JSON.stringify(r,null,2));if(r.results.some(x=>!x.candidate.pass))process.exitCode=1;
