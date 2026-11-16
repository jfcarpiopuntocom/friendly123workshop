// Server-to-server admission: native service binding only, never an endpoint supplied by a browser.
export function secureMode(env){return env.WS_AUTHORITY_QA==='1';}
export function ticketRequest(request,room){const p=new URL(request.url).searchParams;return{token:p.get('cap'),licenseCode:String(p.get('licencia')||'').trim().toUpperCase(),instanceId:p.get('instancia')||'',room,requiredScope:'priv:read'};}
function validatedAccess(data,access){
  const p=data?.principal,now=Date.now();
  // Only the Owner-private projection is enabled in this first secure integration.
  if(data?.ok!==true||p?.role!=='dueno'||p.subject!=='owner-account'||p.license!==access.licenseCode||p.instance!==access.instanceId||p.room!==access.room||!Number.isSafeInteger(p.iat)||!Number.isSafeInteger(p.exp)||p.iat>now||p.exp<=now||!Array.isArray(p.scopes)||!p.scopes.includes('priv:read'))return null;
  return{...access,principal:p};
}
async function query(env,action,body){
  if(!secureMode(env)||!env.WS_AUTHORITY?.fetch||typeof env.WS_SERVICE_KEY!=='string'||env.WS_SERVICE_KEY.length<32)return null;
  try{
    const response=await env.WS_AUTHORITY.fetch('https://authority.invalid/ws/'+action,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.WS_SERVICE_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(2400)});
    return response.ok?await response.json():null;
  }catch(_){return null;}
}
export async function askAuthority(env,action,access){return validatedAccess(await query(env,action,access),access);}
export async function askAuthorityBatch(env,accesses){
  if(!accesses.length||accesses.length>64)return null;
  const first=accesses[0];
  if(accesses.some(a=>a.licenseCode!==first.licenseCode||a.room!==first.room))return null;
  const data=await query(env,'check-many',{licenseCode:first.licenseCode,room:first.room,requests:accesses});
  if(data?.ok!==true||!Array.isArray(data.results)||data.results.length!==accesses.length)return null;
  return data.results.map((result,i)=>validatedAccess(result,accesses[i]));
}
export function unexpired(access){return !!access?.principal&&access.principal.iat<=Date.now()&&access.principal.exp>Date.now();}
