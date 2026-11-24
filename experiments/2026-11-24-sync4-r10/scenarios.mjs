function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function makeModelStore(validate){
 const pending=new Map(),settled=new Set();
 const clone=x=>JSON.parse(JSON.stringify(x));
 return {
 async loadAll(){return [...pending.values()].map(clone);},
 async loadCommittedOpIds(){return [...settled];},
 async save(row){
  if(!validate(row.command).ok||row.sameDoLocked!==true||!Number.isSafeInteger(row.attempts)||row.attempts<0||row.attempts>10||Object.keys(row).sort().join(",")!=="attempts,command,createdAt,opId,sameDoLocked,state,updatedAt")throw Error("Invalid row");
  if(settled.has(row.opId)){const e=Error("Already settled");e.code="TYPED_OPS_ALREADY_SETTLED";throw e;}
  if(pending.has(row.opId)&&JSON.stringify(validate(pending.get(row.opId).command).canonical)!==JSON.stringify(validate(row.command).canonical))throw Error("payload mismatch");
  pending.set(row.opId,clone(row));
 },
 async markCommitted(id){if(!pending.has(id)&&!settled.has(id))throw Error("Missing pending");settled.add(id);pending.delete(id);},
 async remove(id){pending.delete(id);}
 };
}
async function exerciseFull(create,store,kind,reverse=false){
 const A=reverse?"sale-second-001":"sale-first-001",B=reverse?"sale-first-001":"sale-second-001";
 const command=opId=>({opId,license:"F123-TEST0001",kind:"sale.record",productId:"sku1",quantity:1,amountCents:1500});
 const mk=opId=>({opId,command:command(opId),sameDoLocked:true,attempts:1,state:"pending",createdAt:1,updatedAt:1});
 await store.save(mk(A));await store.save(mk(B));
 const calls=[],saves=[],timers=new Map(),notifications=[];
 let timerId=0,visible=true;
 const aStart=deferred(),aRelease=deferred(),bStart=deferred(),bRelease=deferred(),bCommitted=deferred();
 const wrap={...store,loadAll:async()=> (await store.loadAll()).sort((x,y)=>Number(y.opId===A)-Number(x.opId===A)),save:async row=>{saves.push({id:row.opId,state:row.state,attempts:row.attempts});return store.save(row);}};
 const committed=id=>({committed:true,stage:"business-committed",status:200,receipt:{opId:id,license:"F123-TEST0001"}});
 const uncertain={committed:false,reconcileRequired:true,retryable:true,retryTarget:"same-do-only",stage:"commit-unverified",status:503};
 const r=create({store:wrap,dispatch:async cmd=>{
   calls.push(cmd.opId);
   if(cmd.opId===A){aStart.resolve();await aRelease.promise;return committed(A);}
   if(calls.filter(id=>id===B).length===1){
     bStart.resolve();
     if(kind==="inflight")await bRelease.promise;
     if(kind==="quarantine")return {quarantine:true,stage:"conflict-quarantine",status:409};
     if(kind==="pending"||kind==="retry-later"||kind==="submit-pending"||kind==="timer-pending")return uncertain;
   }
   return committed(B);
 },isVisible:()=>visible,now:()=>100,schedule:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},cancelSchedule:id=>timers.delete(id),onSettled:e=>{notifications.push(e);if(e.opId===B&&e.status==='committed')bCommitted.resolve();}});
 await r.ready();
 const p1=r.reconcileNow();await aStart.promise;
 if(kind==="serial"||kind==="hidden"){
   if(kind==="hidden")visible=false;
   aRelease.resolve();await p1;
   const rows=await store.loadAll(),terminal=await store.loadCommittedOpIds();
   const pass=kind==="serial"?calls.length===2&&rows.length===0&&terminal.length===2:calls.length===1&&rows.length===1&&rows[0].opId===B&&terminal.length===1;
   r.destroy();return {pass,calls,rows,terminal,notifications:notifications.length};
 }
 const p2=kind==="submit-pending"?r.submit(command(B)):r.reconcileNow();
 await bStart.promise;
 if(kind!=="inflight")await p2;
 const beforeRelease=saves.filter(s=>s.id===B).length;
 aRelease.resolve();await p1;
 if(kind==="inflight"){bRelease.resolve();await p2;}
 const rows=await store.loadAll(),terminal=await store.loadCommittedOpIds();
 const bcalls=calls.filter(x=>x===B).length,bsaves=saves.filter(x=>x.id===B).length;
 const deferredPending=["pending","retry-later","submit-pending","timer-pending"].includes(kind);
 const bNotifications=notifications.filter(n=>n.opId===B).length;
 const pass=bcalls===1&&bsaves===beforeRelease&&bNotifications===(deferredPending?0:1)&&
   (kind==="quarantine"?rows.some(x=>x.opId===B&&x.state==="quarantined")&&!terminal.includes(B):
    deferredPending?rows.some(x=>x.opId===B&&x.state==="pending"&&x.sameDoLocked)&&!terminal.includes(B)&&timers.size===1:
    rows.length===0&&terminal.includes(B));
 let later=null;
 if(kind==="retry-later"||kind==="timer-pending"){
   if(kind==="retry-later")await r.reconcileNow();
   else {const item=[...timers.values()][0];if(item){timers.clear();item.fn();let timeout;try{await Promise.race([bCommitted.promise,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('timer did not settle')),5000);})]);}finally{clearTimeout(timeout);}}}
   const rest=await store.loadAll(),ids=await store.loadCommittedOpIds();
   later={pass:calls.filter(x=>x===B).length===2&&rest.length===0&&ids.includes(B),calls:[...calls],remaining:rest.length};
 }
 r.destroy();
 return {pass:pass&&(!later||later.pass),calls,bsaves,beforeRelease,remaining:rows.map(x=>({opId:x.opId,state:x.state,attempts:x.attempts})),terminal,bNotifications,notifications:notifications.map(x=>x.status),later};
}

export {exerciseFull,makeModelStore};
