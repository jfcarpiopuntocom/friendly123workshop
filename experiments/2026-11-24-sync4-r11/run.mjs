import {createVerifiedCrossDeviceFailbackCoordinator as original} from './baseline.mjs';
import {createVerifiedCrossDeviceFailbackCoordinator as candidate} from './candidate.mjs';
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
async function runCase(create,kind){
 const opId="r11-sale-001",command={opId};
 let visible=true,blockNext=false,reads=0,submitted=0,drains=0,posted=0;
 const entered=deferred(),release=deferred(),inSubmit=deferred(),releaseSubmit=deferred();
 const store={async loadAll(){reads++;if(blockNext){blockNext=false;entered.resolve();await release.promise;}return [];},async loadCommittedOpIds(){return [];},async save(){},async remove(){}};
 function make(){return create({store,reconciler:{async ready(){},pending(){return []},quarantined(){return []},async submit(){submitted++;if(kind==="late-fallback"||kind==="late-committed"){inSubmit.resolve();await releaseSubmit.promise;return kind==="late-fallback"?{fallbackLegacy:true,stage:"precondition-denied"}:{committed:true,fallbackLegacy:false,stage:"business-committed"};}posted++;return {committed:true,fallbackLegacy:false,stage:"business-committed"};},async reconcileNow(){drains++;return {attempted:1,results:[]}},destroy(){}},openCatalogSession:async()=>({frozenHead:"head-001",close(){},isActive(){return true}}),isVisible:()=>visible});}
 const a=make(),b=make();
 let res,pass;
 const assert=async()=>{try{return await a.assertLegacyAllowed(opId)}catch(e){return {allowed:false,code:e.code}}};
 if(kind==="destroy-before"){a.destroy();res=await a.canDispatchOnLegacy(opId);pass=res===false&&reads===0;}
 else if(kind==="assert-destroy-before"){a.destroy();res=await assert();pass=res.allowed===false&&reads===0;}
 else if(kind==="destroy-during"||kind==="assert-destroy-during"){blockNext=true;const p=kind==="destroy-during"?a.canDispatchOnLegacy(opId):assert();await entered.promise;a.destroy();release.resolve();res=await p;pass=kind==="destroy-during"?res===false:res.allowed===false;}
 else if(kind==="claim-during"||kind==="assert-claim-during"){await b.activate20();blockNext=true;const p=kind==="claim-during"?a.canDispatchOnLegacy(opId):assert();await entered.promise;const q=b.submitCommercial(command);release.resolve();res=await p;const sent=await q;pass=(kind==="claim-during"?res===false:res.allowed===false)&&sent.committed===true&&posted===1;}
 else if(kind==="submit-destroy-during"){await a.activate20();blockNext=true;const p=a.submitCommercial(command);await entered.promise;a.destroy();release.resolve();res=await p;pass=res.fallbackLegacy===false&&submitted===0;}
 else if(kind==="drain-destroy-during"||kind==="drain-hidden-during"){blockNext=true;const p=a.drainLatchedSameDo();await entered.promise;if(kind==="drain-destroy-during")a.destroy();else visible=false;release.resolve();res=await p;pass=drains===0&&res.attempted===0;}
 else if(kind==="late-fallback"||kind==="late-committed"){await a.activate20();const p=a.submitCommercial(command);await inSubmit.promise;a.destroy();releaseSubmit.resolve();res=await p;pass=kind==="late-fallback"?res.fallbackLegacy===false:res.committed===true;}
 else if(kind==="legacy-fresh"){res=await a.canDispatchOnLegacy(opId);pass=res===true;}
 else if(kind==="explicit-failback"){await a.activate20();await a.failbackToLegacy("network");res=await a.submitCommercial(command);pass=res.fallbackLegacy===true;}
 else if(kind==="drain-live"){res=await a.drainLatchedSameDo();pass=drains===1&&res.attempted===1;}
 return {pass,res,reads,submitted,posted,drains};
}
const cases=["destroy-before","assert-destroy-before","destroy-during","assert-destroy-during","claim-during","assert-claim-during","submit-destroy-during","drain-destroy-during","drain-hidden-during","late-fallback","late-committed","legacy-fresh","explicit-failback","drain-live"];
const results=[];for(const k of cases)results.push({case:k,baseline:await runCase(original,k),candidate:await runCase(candidate,k)});
console.log(JSON.stringify(results,null,2));
if(results.filter(r=>r.baseline.pass).length!==4||results.filter(r=>r.candidate.pass).length!==14)process.exitCode=1;
