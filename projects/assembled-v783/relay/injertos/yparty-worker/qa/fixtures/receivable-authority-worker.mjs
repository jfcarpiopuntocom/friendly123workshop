// Synthetic-only Workerd fixture; NEVER imported from production index.js.
import {createCertifiedReceivableAuthorizer} from '../../src/certified-receivable-authority.mjs';
export class ReceivableFixture{
  constructor(ctx){this.sql=ctx.storage.sql;}
  async fetch(request){
    const path=new URL(request.url).pathname;
    if(path==='/seed'&&request.method==='POST'){
      this.sql.exec('CREATE TABLE IF NOT EXISTS f123_business_baseline (license TEXT PRIMARY KEY, sha256 TEXT NOT NULL)');
      this.sql.exec('CREATE TABLE IF NOT EXISTS f123_business_receivables (license TEXT NOT NULL, receivable_id TEXT NOT NULL, balance_cents INTEGER NOT NULL, PRIMARY KEY(license,receivable_id))');
      this.sql.exec('INSERT INTO f123_business_baseline (license,sha256) VALUES (?,?)','F123-SYNTHETIC-BUSINESS','a'.repeat(64));
      this.sql.exec('INSERT INTO f123_business_receivables (license,receivable_id,balance_cents) VALUES (?,?,?)','F123-SYNTHETIC-BUSINESS','fiado_1',3000);
      return Response.json({ok:true});
    }
    if(path==='/zero'&&request.method==='POST'){
      this.sql.exec('UPDATE f123_business_receivables SET balance_cents = 0 WHERE license = ?','F123-SYNTHETIC-BUSINESS');
      return Response.json({ok:true});
    }
    if(path==='/drop-cert'&&request.method==='POST'){
      this.sql.exec('DELETE FROM f123_business_baseline WHERE license = ?','F123-SYNTHETIC-BUSINESS');
      return Response.json({ok:true});
    }
    if(path==='/check'&&request.method==='POST'){
      const body=await request.json();
      return Response.json({allowed:await createCertifiedReceivableAuthorizer({sql:this.sql})(body)});
    }
    return new Response('not found',{status:404});
  }
}
export default {fetch(request,env){return env.QA.get(env.QA.idFromName('isolated-synthetic-fiado')).fetch(request);}};
