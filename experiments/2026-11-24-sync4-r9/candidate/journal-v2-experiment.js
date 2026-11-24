
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
