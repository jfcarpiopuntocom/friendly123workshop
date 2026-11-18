// Real local Workerd DO SQL resource guard. Fixture uses synthetic data only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import path from 'node:path';
test('Gate A: same-DO certified receivable check for Owner/Admin/Team, fail-closed on absent baseline and cross-license',{timeout:45000},async()=>{
  const out=await build({entryPoints:[path.join(import.meta.dirname,'fixtures/receivable-authority-worker.mjs')],
    bundle:true,format:'esm',platform:'neutral',conditions:['workerd','worker','browser'],
    mainFields:['module','main'],external:['cloudflare:*'],write:false});
  const mf=new Miniflare({modules:true,script:out.outputFiles[0].text,compatibilityDate:'2026-06-01',
    compatibilityFlags:['nodejs_compat'],durableObjects:{QA:{className:'ReceivableFixture',useSQLite:true}}});
  try{
    const base=await mf.ready,license='F123-SYNTHETIC-BUSINESS';
    const post=async(path,body={})=>{
      const res=await fetch(new URL(path,base),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      assert.equal(res.status,200);
      return res.json();
    };
    const principal=role=>({license,role,subject:role==='dueno'?'owner-account':role==='admin'?'admin_12345':'team_12345',scopes:['ops:payment']});
    const check=(role,overrides={})=>post('/check',{license,receivableId:'fiado_1',principal:principal(role),...overrides});
    assert.equal((await check('dueno')).allowed,false,'missing baseline fails closed');
    await post('/seed');
    for(const role of ['dueno','admin','empleado'])assert.equal((await check(role)).allowed,true,role);
    assert.equal((await check('empleado',{receivableId:'fiado_other'})).allowed,false);
    assert.equal((await check('admin',{license:'F123-SYNTHETIC-OTHER'})).allowed,false);
    assert.equal((await check('empleado',{principal:{...principal('empleado'),scopes:['cat:read']}})).allowed,false);
    assert.equal((await check('empleado',{principal:{...principal('empleado'),subject:'unverified'}})).allowed,true,'subject syntax alone is not an auth provider: caller must verify central ticket first');
    assert.equal((await check('empleado',{principal:{...principal('empleado'),subject:''}})).allowed,false);
    assert.equal((await check('empleado',{principal:{...principal('empleado'),license:'F123-SYNTHETIC-OTHER'}})).allowed,false);
    assert.equal((await check('artista',{principal:{...principal('empleado'),role:'artista'}})).allowed,false);
    await post('/zero');
    assert.equal((await check('empleado')).allowed,true,'replay of already settled fiado must pass resource check');
    await post('/drop-cert');
    assert.equal((await check('dueno')).allowed,false,'no trusted baseline denies resource even if row remains');
  }finally{await mf.dispose();}
});
