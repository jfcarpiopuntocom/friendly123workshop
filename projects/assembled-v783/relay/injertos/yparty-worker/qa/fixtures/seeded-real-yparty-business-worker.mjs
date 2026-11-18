// TEST-ONLY adapter. Actual Tienda.onRequest, source router and Workerd SQL
// run unchanged; the subclass injects an INTERNAL synthetic frozen snapshot.
// This file and its seed hook are NEVER part of deployed Worker entrypoint.
import worker,{Tienda as RealTienda} from '../../src/index.js';
import {prepareBusinessBaseline,installBusinessBaseline} from '../../src/authoritative-business-sql.mjs';
export class Tienda extends RealTienda {
  async onRequest(req) {
    if(this.env.WS_TEST_ONLY_INTERNAL_SEED==='1'&&this.name===this.env.SALA_PILOTO+'-ops'){
      const baseline={license:'F123-SYNTHETIC-BUSINESS',frozenHead:'synthetic-head-001',
        products:[{productId:'sku_1',quantity:5,unitPriceCents:1500}],openingCashCents:500};
      const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(baseline))))]
        .map(n=>n.toString(16).padStart(2,'0')).join('');
      const proof=await prepareBusinessBaseline({...baseline,sourceFrozenVerified:true,expectedSha256:sha});
      installBusinessBaseline({storage:this.ctx.storage,proof});
    }
    return super.onRequest(req);
  }
}
export default worker;
