'use strict';
// Synthetic browser life-cycle failure diagnosis against the ACTUAL canary script.
// Never accesses a network, customer, license, PIN, or Y.Doc.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../scripts/canario-union-fria.cjs'),'utf8');
const MARKER='HOSTILE-SECRET-PIN-LICENSE-ROOM-MUST-NOT-LOG';

async function runScenario(scenario) {
  const logs=[], pageHooks=new Map(), browserHooks=new Map();
  let exitCode=null, keypadClicks=0, now=0, initialRecoveryPassed=false;
  const pad={
    waitFor:async()=>{},
    click:async()=>{keypadClicks++;},
    isVisible:async()=>true
  };
  const browser={
    on(event,listener){browserHooks.set(event,listener);},
    newPage:async()=>page,
    close:async()=>{}
  };
  const page={
    on(event,listener){pageHooks.set(event,listener);},
    setDefaultTimeout(){},
    async goto(){
      if(scenario==='hostile-pageerror'){
        pageHooks.get('pageerror')?.({name:MARKER,message:MARKER});
        throw Error('synthetic navigation failure');
      }
    },
    locator(){return {first:()=>pad};},
    async click(){},
    async fill(){},
    async evaluate(fn){
      if(String(fn).includes('licenciaAdoptada:'))return {
        licenciaAdoptada:true,syncCodeIgual:true,salaCorrecta:true,tieneDispositivo:true,
        tieneRoomYjs:true,tieneCanalCatalogo:true,catalogoRecuperando:true,
        hidratacionLocalPendiente:false,catalogoIdbSincronizado:true,
        catalogoSinPendientesCausales:false,tieneMetadatosPin:false,
        catalogoPadresFaltantes:3,catalogoClientesAplicados:1,catalogoEstructurasAplicadas:1
      };
      return null;
    },
    async waitForTimeout(ms){
      now+=ms;
      if(ms===5000){
        if(['crash','close','disconnected'].includes(scenario)){
          if(scenario==='disconnected')browserHooks.get('disconnected')?.();
          else pageHooks.get(scenario)?.();
          throw Error(MARKER);
        }
        initialRecoveryPassed=true;
      }
      if(scenario==='poll'&&ms===2000&&initialRecoveryPassed)throw Error(MARKER);
    }
  };
  const fakeProcess={
    argv:['node','scripts/canario-union-fria.cjs'],
    env:{F123_CANARIO_LICENCIA:'F123-QA-SYNTHETIC-ONLY'},
    exit(n){exitCode=n;throw Object.assign(Error('CANARY_EXIT'),{canaryExit:true});}
  };
  const ctx={
    require(name){assert.equal(name,'playwright');return {chromium:{launch:async()=>browser}};},
    process:fakeProcess,
    console:{log:(...xs)=>logs.push(xs.join(' ')),error:(...xs)=>logs.push(xs.join(' '))},
    Date:class FakeDate extends Date{static now(){return now;}},
    setTimeout:()=>1,clearTimeout(){}
  };
  try{await vm.runInNewContext(script,ctx,{filename:'canario-union-fria.cjs',timeout:5000});}
  catch(err){if(!err?.canaryExit)throw err;}
  return {logs,exitCode,keypadClicks};
}
function recorded(logs) {
  const line=logs.find(s=>s.startsWith('CANARIO_NAVEGADOR: '));
  assert.ok(line,'must print allowlisted browser event booleans before intentional cleanup');
  return JSON.parse(line.slice('CANARIO_NAVEGADOR: '.length));
}

test('P0: browser pageerror.name is untrusted and never echoes private strings',async()=>{
  const got=await runScenario('hostile-pageerror');
  assert.equal(got.exitCode,1);
  assert.ok(got.logs.includes('CANARIO_JS_ERRORES: Error'),
    'malicious Error.name must map to allowlisted Error');
  assert.equal(got.logs.join('\n').includes(MARKER),false);
  assert.deepEqual(recorded(got.logs),
    {pageCrashed:false,pageClosed:false,browserDisconnected:false});
  assert.equal(got.keypadClicks,0,'never type an Owner PIN after navigation exception');
});

for(const ev of ['crash','close','disconnected']) {
  test('P0: real canary records only boolean '+ev+' before closing browser',async()=>{
    const got=await runScenario(ev);
    assert.equal(got.exitCode,1,'browser termination is never a successful cold join');
    assert.ok(got.logs.includes('CANARIO_ERROR_ETAPA: RECUPERACION'),
      'initial recovery stage remains backward compatible');
    const flags=recorded(got.logs);
    assert.deepEqual(flags,{
      pageCrashed:ev==='crash',
      pageClosed:ev==='close',
      browserDisconnected:ev==='disconnected'
    });
    assert.equal(got.logs.join('\n').includes(MARKER),false,
      'raw error/URL/credentials are never logged');
    assert.equal(got.keypadClicks,3,'only factory selector PIN, no owner PIN after termination');
  });
}

test('P0: failure during repeated 2-second recovery poll has a specific safe stage',async()=>{
  const got=await runScenario('poll');
  assert.equal(got.exitCode,1);
  assert.ok(got.logs.includes('CANARIO_ERROR_ETAPA: RECUPERACION_SONDEO'),
    'classify poll failure distinctly from initial 5s recovery delay');
  assert.deepEqual(recorded(got.logs),
    {pageCrashed:false,pageClosed:false,browserDisconnected:false});
  assert.equal(got.logs.join('\n').includes(MARKER),false);
  assert.equal(got.keypadClicks,3,'no Owner PIN during incomplete recovery');
});
