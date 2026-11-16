// TEST-ONLY Miniflare Worker. Do not deploy: synthetic authority and fixtures.
import {createTypedCommercialLedger} from '../../src/typed-commercial-ledger.mjs';
const LICENSE='F123-SYNTHETIC-LEDGER';
export class SyntheticCommands {
  constructor(ctx){
    this.storage=ctx.storage;
    this.inbox=createTypedCommercialLedger({
      sql:ctx.storage.sql,
      transactionSync:ctx.storage.transactionSync.bind(ctx.storage),
      authorize:async({ticket,license,scope})=>
        ticket==='synthetic-signed-ticket'&&license===LICENSE
          ? {ok:true,principal:{license,subject:'synthetic-owner',scopes:[scope]}}
          : {ok:false},
      clock:()=>1730000000000
    });
  }
  async fetch(request){
    if(new URL(request.url).pathname==='/test-count'){
      const rows=Array.from(this.storage.sql.exec('SELECT COUNT(*) AS count FROM typed_commercial_ops'));
      return Response.json({count:rows[0]?.count||0});
    }
    if(request.method!=='POST')return new Response('method',{status:405});
    try{
      const r=await this.inbox.submit(await request.json());
      return Response.json(r,{status:r.status});
    }catch(_){return Response.json({ok:false,reason:'synthetic-fixture-error'},{status:503});}
  }
}
export default {
  fetch(request,env){
    const id=env.COMMANDS.idFromName('synthetic-tenant');
    return env.COMMANDS.get(id).fetch(request);
  }
};
