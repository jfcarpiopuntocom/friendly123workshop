import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import {chromium} from 'playwright';
import {pinAuthority} from '../cloudflare-worker/pin-authority.mjs';
import {teamDoRoute,teamPublicRoute} from '../cloudflare-worker/team-worker-api.mjs';
const license='F123-SYNTHETIC-TEAM',instance='synthetic-instance';
function storage(){let records=new Map(),tail=Promise.resolve();return{get:async k=>structuredClone(records.get(k)),transaction:async f=>{let release;const before=tail;tail=new Promise(r=>release=r);await before;const next=new Map([...records].map(([k,v])=>[k,structuredClone(v)]));try{const r=await f({get:async k=>structuredClone(next.get(k)),put:async(k,v)=>next.set(k,structuredClone(v)),delete:async k=>next.delete(k)});records=next;return r;}finally{release();}}};}
test('Chromium Team change survives server failure and reload then reaches the real authority API once',async()=>{
  const db=storage(),env={PIN_PEPPER:'synthetic-owner-secret-more-than-32-bytes',TEAM_PIN_PEPPER:'synthetic-team-secret-separate-32-bytes',TEAM_AUTHORITY_QA:'1',TEAM_AUTHORITY_LICENSE:license};
  await db.transaction(tx=>tx.put('inst:'+instance,{licenseCode:license,instanceId:instance}));
  const owner=pinAuthority(db,env.PIN_PEPPER);await owner.masterSet(license,'123',0,[instance]);await owner.masterActivate(license,'123',0,[instance]);
  const root=path.resolve(import.meta.dirname,'../docs');
  const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://local').pathname;const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(fs.readFileSync(file));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,available=false;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage({serviceWorkers:'block'});const origin='http://127.0.0.1:'+server.address().port;
    await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
    await page.routeWebSocket('**/*',ws=>ws.close());
    await page.route('https://friendly123-licencias.jfcarpio.workers.dev/team/**',async route=>{
      if(!available)return route.fulfill({status:503,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:JSON.stringify({ok:false,reason:'authority-unavailable'})});
      const request=route.request();const response=await teamPublicRoute(new Request(request.url(),{method:request.method(),body:request.postData()}),env,{getDo:()=>({fetch:(url,opts)=>teamDoRoute(new Request(url,opts),db,env)})});
      await route.fulfill({status:response.status,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body:await response.text()});
    });
    await page.addInitScript(({license,instance})=>{localStorage.setItem('f123_team_authority_qa','1');localStorage.setItem('f123_owned',JSON.stringify({licenseCode:license,instanceId:instance}));},{license,instance});
    async function localOwner(){await page.waitForFunction(()=>window.OCSync&&window.F123TeamAuthority);await page.evaluate(license=>{window.OCAuth={rolActual:()=> 'dueno'};window.OCTienda={licenciaActual:()=>license};window.OCSecure={estadoSecreto:()=> 'ok',coincidePin:async()=>false,leerPinsVisibles:()=>null,leerPinQueAbre:()=>({owner:'123'})};},license);}
    await page.goto(origin);await localOwner();
    const id=await page.evaluate(async()=>{const r=await fetch('/api/usuarios',{method:'POST',body:JSON.stringify({nombre:'Synthetic',pin:'234',rol:'admin'})});if(!r.ok)throw Error('local Team HTTP '+r.status);return(await r.json()).id;});
    await page.waitForFunction(()=>window.F123TeamAuthority.status().state==='pending');
    const op=await page.evaluate(()=>window.OCSync.leerIntencionesAutoridad()[0]._teamAuthorityIntent.opId);
    await page.reload();await localOwner();
    assert.equal(await page.evaluate(()=>window.OCSync.leerIntencionesAutoridad()[0]?._teamAuthorityIntent.opId),op);
    available=true;await page.evaluate(()=>window.F123TeamAuthority.flush());
    assert.equal(await page.evaluate(()=>window.OCSync.leerIntencionesAutoridad().length),0);
    const response=await teamDoRoute(new Request('https://internal/team-authority/internal',{method:'POST',body:JSON.stringify({action:'verify',licenseCode:license,instanceId:instance,subject:id,pin:'234'})}),db,env);
    assert.equal(response.status,200);assert.equal((await response.json()).principal.role,'admin');
    await page.reload();await localOwner();
    assert.equal(await page.evaluate(()=>window.OCSync.leerIntencionesAutoridad().length),0,'matching ACK receipt survives real IndexedDB reload');
    await page.evaluate(id=>{const catalog=window.OCSync.catalogoPropio(),u=catalog.usuarios.find(u=>u.id===id);u.rol='empleado';u.pin='345';u.rev={...u.rev,c:u.rev.c+100};window.OCSync.aplicarCatalogo(catalog,null);},id);
    assert.equal(await page.evaluate(()=>window.OCSync.leerIntencionesAutoridad().length),1,'a later remote credential change exposes the retained receipt');
    await page.evaluate(()=>window.F123TeamAuthority.flush());
    assert.equal(await page.evaluate(()=>window.F123TeamAuthority.status().reason),'local-source-changed');
    assert.equal((await db.get('team-authority-v1:'+license)).revision,1,'changed source never silently writes another server authorization');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
