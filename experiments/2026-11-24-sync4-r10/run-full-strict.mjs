import {createTypedOpsReconciler as original} from '../../src/port2-typed-ops-reconciler.mjs';
import {createTypedOpsReconciler as candidate} from './candidate-r10b/port2-typed-ops-reconciler.mjs';
import {validateTypedCommercialCommand as validate} from '../../src/port2-typed-ops-client.mjs';
import {exerciseFull,makeModelStore} from './scenarios.mjs';
const cases=[["settled",false],["settled",true],["inflight",false],["quarantine",false],["pending",false],["retry-later",false],["submit-pending",false],["timer-pending",false],["serial",false],["hidden",false]];
const results=[];for(const [kind,rev] of cases)results.push({kind,reverse:rev,baseline:await exerciseFull(original,makeModelStore(validate),kind,rev),candidate:await exerciseFull(candidate,makeModelStore(validate),kind,rev)});
console.log(JSON.stringify(results,null,2));
if(results.filter(r=>r.baseline.pass).length!==2||results.filter(r=>r.candidate.pass).length!==10)process.exitCode=1;
