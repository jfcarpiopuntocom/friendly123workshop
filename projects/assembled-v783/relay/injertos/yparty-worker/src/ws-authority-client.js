// Server-to-server admission: native service binding only, never an endpoint supplied by a browser.
export function secureMode(env){return env.WS_AUTHORITY_QA==='1';}
export function ticketRequest(request,room){const p=new URL(request.url).searchParams;return{token:p.get('cap'),licenseCode:String(p.get('licencia')||'').trim().toUpperCase(),instanceId:p.get('instancia')||'',room,requiredScope:'priv:read'};}
export async function askAuthority(env,action,access){
  if(!secureMode(env)||!env.WS_AUTHORITY?.fetch||typeof env.WS_SERVICE_KEY!=='string'||env.WS_SERVICE_KEY.length<32)return null;
  try{
    const response=await env.WS_AUTHORITY.fetch('https://authority.invalid/ws/'+action,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.WS_SERVICE_KEY},body:JSON.stringify(access),signal:AbortSignal.timeout(2400)});
    if(!response.ok)return null;
    const data=await response.json(),p=data?.principal,now=Date.now();
    // Only the Owner-private projection is enabled in this first secure integration.
    if(data.ok!==true||p?.role!=='dueno'||p.subject!=='owner-account'||p.license!==access.licenseCode||p.instance!==access.instanceId||p.room!==access.room||!Number.isSafeInteger(p.iat)||!Number.isSafeInteger(p.exp)||p.iat>now||p.exp<=now||!Array.isArray(p.scopes)||!p.scopes.includes('priv:read'))return null;
    return{...access,principal:p};
  }catch(_){return null;}
}
export function unexpired(access){return !!access?.principal&&access.principal.iat<=Date.now()&&access.principal.exp>Date.now();}
