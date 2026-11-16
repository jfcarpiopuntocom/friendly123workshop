// Team's local transaction remains the source of retry intent. No second PIN store or login.
// This adapter is dormant outside the explicitly enabled QA candidate.
(function(){
  'use strict';
  let inFlight=null,revision=0,state={state:'idle'},activeController=null;
  function context(){
    try{
      if(localStorage.getItem('f123_team_authority_qa')!=='1'||window.OCAuth?.rolActual()!=='dueno')return null;
      const owned=JSON.parse(localStorage.getItem('f123_owned')||'null');
      const license=String(owned?.licenseCode||'').trim().toUpperCase();
      if(!/^F123-[A-Z0-9*~$=-]{8,34}$/.test(license)||!/^[A-Za-z0-9_-]{6,120}$/.test(owned?.instanceId||''))return null;
      if(window.OCTienda?.licenciaActual&&String(window.OCTienda.licenciaActual()||'').trim().toUpperCase()!==license)return null;
      return{licenseCode:license,instanceId:owned.instanceId};
    }catch(_){return null;}
  }
  function current(id){const c=context();return !!c&&c.licenseCode===id.licenseCode&&c.instanceId===id.instanceId;}
  function credential(u){return JSON.stringify([u.rol,u.pin,u.activo!==false,!!u.borrado]);}
  function prepare(before,after){
    const id=context();if(!id)return;
    for(const u of after){
      if(!['admin','empleado','contador','artista'].includes(u.rol))continue;
      const old=before.find(x=>x.id===u.id);
      if(old&&credential(old)===credential(u)){
        if(u._teamAuthorityIntent)u._teamAuthorityIntent={...u._teamAuthorityIntent,sourceRevision:JSON.stringify(u.rev)};
        continue;
      }
      u._teamAuthorityIntent={opId:'team-'+crypto.randomUUID(),licenseCode:id.licenseCode,instanceId:id.instanceId,expectedRevision:revision,sourceRevision:JSON.stringify(u.rev),role:u.rol,active:!u.borrado&&u.activo!==false};
    }
  }
  async function post(path,body){
    // Never accept a localStorage-controlled endpoint for PIN-bearing traffic.
    const controller=new AbortController();activeController=controller;
    const timer=setTimeout(()=>controller.abort(),2400);
    try{
      const response=await fetch('https://friendly123-licencias.jfcarpio.workers.dev'+path,{method:'POST',mode:'cors',cache:'no-store',signal:controller.signal,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      return{response,data:await response.json()};
    }finally{clearTimeout(timer);if(activeController===controller)activeController=null;}
  }
  function ownerPin(){try{return window.OCSecure?.leerPinQueAbre?.().owner;}catch(_){return null;}}
  async function drain(){
    const id=context();if(!id)return;
    const pin=ownerPin();if(typeof pin!=='string'||!/^\d{3}$/.test(pin)){state={state:'pending',reason:'owner-authentication-needed'};return;}
    while(current(id)){
      const users=window.OCSync?.leerIntencionesAutoridad?.()||[];
      const u=users.find(x=>x._teamAuthorityIntent?.licenseCode===id.licenseCode&&x._teamAuthorityIntent?.instanceId===id.instanceId);
      if(!u){state={state:'idle'};return;}
      const intent=u._teamAuthorityIntent;
      if(intent.sourceRevision!==JSON.stringify(u.rev)||intent.role!==u.rol||intent.active!==(!u.borrado&&u.activo!==false)){state={state:'pending',reason:'local-source-changed'};return;}
      const source={sourceRevision:intent.sourceRevision,role:intent.role,active:intent.active,pin:u.pin};
      try{
        const {response,data}=await post('/team/update',{...id,ownerPin:pin,opId:intent.opId,expectedRevision:intent.expectedRevision,subject:u.id,role:intent.role,active:intent.active,...(intent.active?{pin:u.pin}:{})});
        if(!current(id))return;
        if(!response.ok||data.ok!==true){state={state:response.status===409?'conflict':'pending',reason:data.reason||'remote-unconfirmed'};return;}
        const acknowledgedRevision=data.status==='already-applied'?data.appliedRevision:data.revision;
        if(!Number.isSafeInteger(acknowledgedRevision)||acknowledgedRevision<intent.expectedRevision){state={state:'pending',reason:'invalid-ack'};return;}
        // Only remove this intent after a confirmed server result and a matching durable local save.
        const saved=await window.OCSync.confirmarAutoridad(u.id,intent.opId,intent.expectedRevision,acknowledgedRevision,source);
        if(!saved){state={state:'pending',reason:'local-ack-unconfirmed'};return;}
        revision=acknowledgedRevision;
      }catch(_){state={state:'pending',reason:'authority-unavailable'};return;}
    }
  }
  function flush(){if(!inFlight)inFlight=Promise.resolve().then(drain).finally(()=>{inFlight=null;});return inFlight;}
  async function refresh(){
    const id=context(),pin=ownerPin();if(!id||!pin)return;
    try{
      const {response,data}=await post('/team/status',{...id,ownerPin:pin});
      if(current(id)&&response.ok&&data.ok===true&&Number.isSafeInteger(data.revision))revision=data.revision;
    }catch(_){} // Existing locally durable intents keep their original CAS; never silently rebase them.
    return flush();
  }
  window.F123TeamAuthority=Object.freeze({prepare,flush,refresh,status:()=>({...state})});
  window.addEventListener('online',flush);
  window.addEventListener('oc-login',refresh);
  window.addEventListener('oc-logout',()=>{activeController?.abort();state={state:'pending',reason:'signed-out'};revision=0;});
})();
