// Gate A server-only resource guard for the legacy receivableId contract.
// Central ticket verification must run separately on every submission/replay;
// this function only verifies the trusted, independently installed SQL resource.
// Never conflate receivableId with the browser's clienteId/car​​tera_abono ledger.
const LICENSE=/^F123-[0-9A-Z*~$=-]{8,34}$/;
const IDENT=/^[A-Za-z0-9_-]{1,64}$/;
const SUBJECT=/^[A-Za-z0-9_-]{5,120}$/;
const SHA=/^[a-f0-9]{64}$/;
function actor(p,license){
  return !!p&&p.license===license&&Array.isArray(p.scopes)&&p.scopes.includes('ops:payment')&&
    ((p.role==='dueno'&&p.subject==='owner-account')||
      ((p.role==='admin'||p.role==='empleado')&&SUBJECT.test(p.subject||'')));
}
export function createCertifiedReceivableAuthorizer({sql}={}){
  if(typeof sql?.exec!=='function')throw new TypeError('trusted DO SQL required');
  return async function authorizeReceivable({license,receivableId,principal}={}){
    if(!LICENSE.test(license||'')||!IDENT.test(receivableId||'')||!actor(principal,license))return false;
    try{
      const cert=sql.exec('SELECT sha256 FROM f123_business_baseline WHERE license = ?',license).toArray();
      if(cert.length!==1||!SHA.test(cert[0]?.sha256||''))return false;
      const matches=sql.exec('SELECT balance_cents FROM f123_business_receivables WHERE license = ? AND receivable_id = ?',license,receivableId).toArray();
      // A zero balance is valid for replay of a previously committed payment;
      // the transactional executor still rejects any NEW amount above balance.
      return matches.length===1&&Number.isSafeInteger(Number(matches[0].balance_cents))&&Number(matches[0].balance_cents)>=0;
    }catch(_){return false;}
  };
}
