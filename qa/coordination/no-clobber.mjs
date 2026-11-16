// Multi-agent ownership / provenance check. Coordination guard, not application runtime.
// No network, no credential reads, no changes to any file. Fails closed on collisions.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const KNOWN_ACTORS = new Set(['codex','claude','sol','fable','ponytail','human']);
const VALID_STATUSES = new Set(['integrated','pending','deferred']);
const SHA40 = /^[0-9a-f]{40}$/;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const violation=(code,pathValue=null,details='')=>({code,path:pathValue,details});

function isCleanRelativeFile(file) {
  if(typeof file !== 'string' || !file || file.trim()!==file ||
     file.includes('\\') || file.includes('\0') || file.startsWith('/') ||
     file.includes('//') || file.startsWith('./') || file.endsWith('/') ||
     /^[a-z]:/i.test(file)) return false;
  const segments=file.split('/');
  return segments.every(p=>p!=='' && p!=='.' && p!=='..');
}
function belongs(pattern, file) {
  if(pattern.endsWith('/**'))return file.startsWith(pattern.slice(0,-2)) && file.length>pattern.length-2;
  return pattern===file;
}
function patternsOverlap(a,b) {
  if(a===b)return true;
  if(a.endsWith('/**') && b.startsWith(a.slice(0,-2)))return true;
  if(b.endsWith('/**') && a.startsWith(b.slice(0,-2)))return true;
  return false;
}
function sensitive(file) {
  return file.split('/').some(seg =>
    /^\.env(?:\.|$)/i.test(seg) ||
    /(?:^|[._-])(?:secret|credentials?)(?:[._-]|$)/i.test(seg) ||
    /\.(?:pem|p12|pfx|key|sqlite|db|zip|bundle|bak)$/i.test(seg) ||
    /\.(?:tar\.gz|tar\.zst|tar\.xz)$/i.test(seg)
  );
}
export function checkChangeSet({ledger,actor,paths}={}) {
  const violations=[];
  if(!KNOWN_ACTORS.has(actor)) {
    violations.push(violation('UNKNOWN_ACTOR',null,String(actor)));
    return {ok:false,violations};
  }
  if(!ledger || ledger.schemaVersion!==1 || !Array.isArray(ledger.owners)) {
    return {ok:false,violations:[violation('INVALID_LEDGER')]};
  }
  if(!Array.isArray(paths))return {ok:false,violations:[violation('INVALID_CHANGESET')]};
  const seen=new Set();
  for(const file of paths){
    if(!isCleanRelativeFile(file)){violations.push(violation('INVALID_PATH',String(file)));continue}
    if(seen.has(file)){violations.push(violation('DUPLICATE_PATH',file));continue}
    seen.add(file);
    if(sensitive(file)){violations.push(violation('SENSITIVE_PATH',file));continue}
    const matched=ledger.owners.filter(row=>belongs(row.pattern,file));
    if(matched.length===0){violations.push(violation('UNOWNED_ROOT',file));continue}
    // Do not apply "most specific wins": overlapping claims must be resolved explicitly.
    if(matched.length!==1){violations.push(violation('OVERLAPPING_OWNERS',file));continue}
    if(matched[0].owner!=='shared' && matched[0].owner!==actor)
      violations.push(violation('OWNER_COLLISION',file,'reserved for '+matched[0].owner));
  }
  return {ok:violations.length===0,violations};
}
export function verifyInjertoLedger({ledger,exists}={}) {
  const violations=[];
  if(!ledger || ledger.schemaVersion!==1 ||
     ledger.repository!=='jfcarpiopuntocom/friendly123workshop' ||
     !Array.isArray(ledger.components) || !Array.isArray(ledger.owners))
    return {ok:false,violations:[violation('INVALID_LEDGER')]};
  for(let i=0;i<ledger.owners.length;i++){
    const a=ledger.owners[i];
    if(typeof a.pattern!=='string' ||
      (!a.pattern.endsWith('/**') && !isCleanRelativeFile(a.pattern)) ||
      !['shared',...KNOWN_ACTORS].includes(a.owner))
      violations.push(violation('INVALID_OWNER',a.pattern));
    for(let j=i+1;j<ledger.owners.length;j++){
      const b=ledger.owners[j];
      if(typeof b.pattern==='string' && patternsOverlap(a.pattern,b.pattern))
        violations.push(violation('OVERLAPPING_OWNERS',a.pattern+' <-> '+b.pattern));
    }
  }
  const fileExists=typeof exists==='function'?exists:(file)=>fs.existsSync(path.join(ROOT,file));
  const componentIds=new Set();
  for(const c of ledger.components){
    if(!c || typeof c.id!=='string' || componentIds.has(c.id)){
      violations.push(violation('INVALID_COMPONENT',c?.id||null));continue
    }
    componentIds.add(c.id);
    if(!VALID_STATUSES.has(c.status)){violations.push(violation('INVALID_STATUS',c.id));continue}
    if(c.status==='integrated'){
      const files=Array.isArray(c.paths)?c.paths:[];
      const valid=SHA40.test(c.proofSha||'') && files.length>0 &&
        files.every(p=>isCleanRelativeFile(p)&&fileExists(p));
      if(!valid)violations.push(violation('UNPROVEN_INTEGRATION',c.id));
    } else if (c.proofSha || (Array.isArray(c.paths)&&c.paths.length)){
      violations.push(violation('UNPROVEN_INTEGRATION',c.id,'pending/deferred may not claim landed files'));
    }
  }
  return {ok:violations.length===0,violations};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=Object.fromEntries(process.argv.slice(2).reduce((a,x,i,all)=>{
    if(i%2===0)a.push([String(x).replace(/^--/,''),all[i+1]]);
    return a;
  },[]));
  try{
    const ledger=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/coordination/INJERTOS-OWNERSHIP.json'),'utf8'));
    const ledgerVerdict=verifyInjertoLedger({ledger});
    if(!args.actor || !args.base || !args.head)throw Error('require --actor --base --head');
    // Exec arg-vector, never shell interpolation.
    const changed=execFileSync('git',['diff','--name-only','--diff-filter=ACMR',args.base,args.head],{
      cwd:ROOT,encoding:'utf8',maxBuffer:2*1024*1024
    }).trim().split('\n').filter(Boolean);
    const changeVerdict=checkChangeSet({ledger,actor:args.actor,paths:changed});
    const report={actor:args.actor,base:args.base,head:args.head,changedCount:changed.length,
      ok:ledgerVerdict.ok&&changeVerdict.ok,
      violations:[...ledgerVerdict.violations,...changeVerdict.violations]};
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.ok)process.exitCode=1;
  }catch(error){
    process.stderr.write(JSON.stringify({ok:false,error:'NO_CLOBBER_CLI_ERROR',reason:error?.code||'invalid-arguments'})+'\n');
    process.exitCode=1;
  }
}
