'use strict';
// Execute the real cold-join canary with a fake browser: no remote network, secrets,
// real PIN attempts, inventory writes or fake positive JOIN.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const script=fs.readFileSync(path.join(__dirname,'../scripts/canario-union-fria.cjs'),'utf8');
const SECRET='SENSITIVE-PIN-LICENSE-URL-NEVER-ECHO';

async function fakeCanary(throwAt) {
  const logs=[]; let exitCode=null, keypadClicks=0, now=0;
  const pad={waitFor:async()=>{},click:async()=>{keypadClicks++;},isVisible:async()=>true};
  const page={
    on(){},setDefaultTimeout(){},
    async goto(){if(throwAt==='NAVEGACION')throw Error(SECRET);},
    locator(){return {first:()=>pad};},
    async click(selector){if(throwAt==='UNION'&&selector==='#oc-ue-confirmar')throw Error(SECRET);},
    async fill(){},
    async evaluate(fn){
      if(String(fn).includes('licenciaAdoptada:'))return {
        licenciaAdoptada:true,syncCodeIgual:true,salaCorrecta:true,tieneDispositivo:true,
        tieneRoomYjs:true,tieneCanalCatalogo:true,catalogoRecuperando:true,
        hidratacionLocalPendiente:false,catalogoIdbSincronizado:true,
        catalogoSinPendientesCausales:false,tieneMetadatosPin:false,
        catalogoPadresFaltantes:2, catalogoClientesAplicados:1,catalogoEstructurasAplicadas:1
      };
      return null;
    },
    async waitForTimeout(ms){now+=ms;if(throwAt==='RECUPERACION'&&ms===5000)throw Error(SECRET);}
  };
  const fakeProcess={
    argv:['node','scripts/canario-union-fria.cjs'],
    env:{F123_CANARIO_LICENCIA:'F123-TEST-COLD-JOIN-ONLY'},
    exit(n){exitCode=n;throw Object.assign(Error('CANARY_EXIT'),{canaryExit:true});}
  };
  const ctx={
    require(name){assert.equal(name,'playwright');return {chromium:{launch:async()=>({
      newPage:async()=>page,close:async()=>{}
    })}};},
    process:fakeProcess,
    console:{log:(...x)=>logs.push(x.join(' ')),error:(...x)=>logs.push(x.join(' '))},
    Date:class FakeDate extends Date{static now(){return now;}},
    setTimeout:()=>1,clearTimeout(){}
  };
  try{await vm.runInNewContext(script,ctx,{filename:'canario-union-fria.cjs',timeout:5000});}
  catch(error){if(!error?.canaryExit)throw error;}
  return {logs,exitCode,keypadClicks};
}

for(const phase of ['NAVEGACION','UNION','RECUPERACION']){
  test('P0: thrown failure at '+phase+' reports only whitelisted stage, preserves failure and never logs exception data',async()=>{
    const got=await fakeCanary(phase);
    assert.equal(got.exitCode,1,'exception must remain red');
    assert.ok(got.logs.some(s=>s==='CANARIO_ERROR_ETAPA: '+phase),
      'classify exact safe phase, not generic unknown Error');
    assert.ok(got.logs.some(s=>s.includes('FALLA EXCEPCION: Error durante la unión')),
      'retain legacy generic failure parser');
    const output=got.logs.join('\n');
    assert.equal(output.includes(SECRET),false,'never leak exception message/tokens');
    assert.equal(output.includes('F123-TEST-COLD-JOIN-ONLY'),false,'never log synthetic license');
    assert.equal(got.keypadClicks,phase==='NAVEGACION'?0:3,
      'exception must not trigger Owner PIN attempt');
  });
}
