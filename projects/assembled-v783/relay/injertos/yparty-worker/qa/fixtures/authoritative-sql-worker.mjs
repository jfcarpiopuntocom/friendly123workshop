// QA-ONLY fixture. The /seed route is NEVER present in actual Tienda Worker.
// Exercises the same server-only production executor + typed-ledger on real Workerd SQLite.
import {prepareBusinessBaseline,installBusinessBaseline,createBusinessSqlExecutor} from '../../src/authoritative-business-sql.mjs';
import {createTypedCommercialLedger} from '../../src/typed-commercial-ledger.mjs';
export class CommercialFixture {
  constructor(ctx){
    this.ctx=ctx;
    this.sql=ctx.storage.sql;
  }
  async fetch(req){
    const path=new URL(req.url).pathname;
    if(path==='/seed'&&req.method==='POST'){
      try{
        const input=await req.json();
        const proof=await prepareBusinessBaseline(input);
        const receipt=installBusinessBaseline({storage:this.ctx.storage,proof});
        return Response.json({ok:true,...receipt},{status:200});
      }catch(e){return Response.json({ok:false,reason:e.message},{status:409});}
    }
    if(path==='/stats'&&req.method==='GET'){
      const rows={};
      for(const [key,query] of [
        ['baseline','SELECT frozen_head,sha256,count,cash_cents FROM f123_business_baseline'],
        ['stock','SELECT product_id,quantity,unit_price_cents FROM f123_business_stock ORDER BY product_id'],
        ['effects','SELECT op_id,product_id,quantity_delta,cash_delta_cents FROM f123_business_effects ORDER BY op_id'],
        ['receipts','SELECT op_id,receipt_json FROM typed_commercial_ops ORDER BY op_id']]){
        try{rows[key]=this.sql.exec(query).toArray();}catch(_){rows[key]=[];}
      }
      return Response.json(rows);
    }
    if(!['/submit','/queue'].includes(path)||req.method!=='POST')return new Response('not found',{status:404});
    const payload=await req.json();
    const executor=createBusinessSqlExecutor({sql:this.sql});
    const ledger=createTypedCommercialLedger({
      sql:this.sql,transactionSync:this.ctx.storage.transactionSync.bind(this.ctx.storage),
      clock:()=>1730000000000,
      authorize:async({ticket,license,scope})=>{
        if(ticket==='synthetic-revoked-ticket'||license!=='F123-SYNTHETIC-BUSINESS'||scope!=='ops:sale')
          return {ok:false};
        const owner=ticket==='synthetic-owner-ticket';
        const team=ticket==='synthetic-team-ticket';
        return owner||team
          ? {ok:true,principal:{license,role:owner?'dueno':'empleado',
              subject:owner?'owner-account':'team_12345',scopes:[scope]}}
          : {ok:false};
      },
      ...(path==='/submit'?{applyBusiness:({sql,command,principal})=>{
        const result=executor({sql,command,principal});
        if(command.opId==='synthetic-rollback-after-stock')throw new Error('synthetic failure before receipt');
        return result;
      }}:{})
    });
    const result=await ledger.submit(payload);
    return Response.json(result,{status:result.ok&&result.receipt?.stage==='stored-for-application'?202:result.status});
  }
}
export default {fetch(request,env){
  return env.BUSINESS.get(env.BUSINESS.idFromName('synthetic-business')).fetch(request);
}};
