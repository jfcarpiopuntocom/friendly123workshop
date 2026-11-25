from pathlib import Path
from tempfile import TemporaryDirectory
import sys,json
from playwright.sync_api import sync_playwright

s=Path(sys.argv[1]).read_text()
if '  var _db = null;' in s:
    a=s.index('  var _migracionEnCurso = null;')
    s=s[a:s.index('  var _db = null;',a)]
h=2166136261
for c in s:h=((h^ord(c))*16777619)&0xffffffff
assert (len(s),h)==(5505,4155518902),(len(s),h)
fixture=r'''async ({code,seed,timeout,second})=>{
 const raw='amg_hechos_db',scoped='f123::amg_hechos_db',target='f123::f123_hechos_db',key='f123::f123_hechos_migrado_v1';
 const open=(name)=>new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('hechos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 const write=async(name,ids)=>{const db=await open(name);await new Promise((resolve,reject)=>{const t=db.transaction('hechos','readwrite');t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(t.error);for(const id of ids)t.objectStore('hechos').put({id});});db.close();};
 const read=async(db)=>new Promise((resolve,reject)=>{const t=db.transaction('hechos','readonly'),q=t.objectStore('hechos').getAllKeys();t.oncomplete=()=>resolve(q.result);t.onerror=()=>reject(t.error)});
 if(!second){for(const [name,ids] of Object.entries(seed))await write(name,ids);}else{await write(scoped,['late-owned']);}
 const db=await open(target);let attempts=0;const opens=[];const env={global:{AMG:{Aislamiento:{namespace:'f123'}}},DB_NAME_VIEJA:raw,DATABASES_TIMEOUT_MS:1500,TX_TIMEOUT_MS:10000,STORE:'hechos',_migracionHecha:()=>localStorage.getItem(key)==='1',_migracionProximoIntento:0,_listarDatabasesConLimite:()=>timeout?Promise.resolve(null):indexedDB.databases(),_marcarMigracionHecha:()=>localStorage.setItem(key,'1'),_registrarFalloMigracion:()=>attempts++,_abrirCruda:async name=>{const physical=name.startsWith('f123::')?name:'f123::'+name;opens.push(physical);return open(physical);},console:{warn(){}}};
 const run=new Function(...Object.keys(env),code+'\nreturn _migrarDesdeBaseVieja;')(...Object.values(env));await run(db);const rows=await read(db);db.close();const marker=localStorage.getItem(key)==='1';const names=(await indexedDB.databases()).map(x=>x.name);let rawRows=null;if(names.includes(raw)){const old=await open(raw);rawRows=await read(old);old.close();}
 return {marker,rows,attempts,opens,rawRows};
}'''
raw='amg_hechos_db';sc='f123::amg_hechos_db'
cases=[('complete absent',{},False,True,[],False),('complete raw-only',{raw:['foreign']},False,False,[],False),('timeout raw-only',{raw:['foreign']},True,False,[],False),('timeout scoped-empty',{sc:[]},True,False,[],False),('complete scoped-empty',{sc:[]},False,True,[],False),('timeout scoped-populated',{sc:['owned']},True,True,['owned'],False),('complete scoped-populated',{sc:['owned']},False,True,['owned'],False),('both raw + scoped-populated',{raw:['foreign'],sc:['owned']},False,True,['owned'],False),('restart after ambiguous empty',{raw:['foreign']},True,False,[],True)]
# Intercept synthetic origin, no external network; requires a browser environment
# that permits this isolated fixture. Do not use real app origin or customer data.
origin='https://fixture.invalid/'
with sync_playwright() as p:
    engine=sys.argv[2] if len(sys.argv)>2 else 'chromium'
    b=getattr(p,engine).launch()
    print(engine,b.version,flush=True)
    def run(code):
        results=[]
        for name,seed,timeout,marker,rows,restart in cases:
            ctx=b.new_context(service_workers='block')
            ctx.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body='<html><body></body></html>') if r.request.url==origin else r.abort())
            page=ctx.new_page();page.goto(origin)
            r=page.evaluate(fixture,dict(code=code,seed=seed,timeout=timeout,second=False))
            ok=r['marker']==marker and r['rows']==rows and r['rawRows']==seed.get(raw) and raw not in r['opens'];rr=None
            if restart:
                page.close();page=ctx.new_page();page.goto(origin)
                rr=page.evaluate(fixture,dict(code=code,seed=seed,timeout=False,second=True))
                ok=ok and rr['marker'] and rr['rows']==['late-owned'] and rr['rawRows']==['foreign'] and raw not in rr['opens']
            ctx.close();results.append(dict(case=name,ok=ok,first=r,second=rr))
        return results
    before=run(s);print('RED',json.dumps(before),flush=True);assert sum(x['ok'] for x in before)==5
    guard='          if (!Array.isArray(dbs) || dbs.some(function (d) { return d && d.name === DB_NAME_VIEJA; })) { _registrarFalloMigracion(); return; }\n'
    fixed=s.replace('        if (!lectura.registros.length) {\n          _marcarMigracionHecha();','        if (!lectura.registros.length) {\n'+guard+'          _marcarMigracionHecha();').replace('          _marcarMigracionHecha();\n          return;\n        }\n        var lectura',guard+'          _marcarMigracionHecha();\n          return;\n        }\n        var lectura')
    after=run(fixed);print('GREEN',json.dumps(after),flush=True);assert all(x['ok'] for x in after);b.close()
    print('PASS',sum(x['ok'] for x in before),'→',sum(x['ok'] for x in after),'/9')
