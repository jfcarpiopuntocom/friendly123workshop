// Durable-object-only typed commercial command INBOX, not a sale executor.
// JFC 2026-11-16: data is not a business commit until the real application
// consumes the operation exactly once and acknowledges its own stock/money write.
// No WebSocket bridge, public endpoint or PWA is changed by this module.
const KINDS=Object.freeze({
  'sale.record':{scope:'ops:sale',detail:'productId',quantity:true},
  'expense.record':{scope:'ops:expense',detail:'categoryId',quantity:false},
  'credit.payment.record':{scope:'ops:payment',detail:'receivableId',quantity:false},
  // A customer payment is not a receivable nor a payment allocation.
  // Existing receivable receipts keep their original canonical bytes.
  'credit.customer.payment.record':{scope:'ops:payment',detail:'clienteId',quantity:false,customerPayment:true}
});
const LICENSE=/^F123-[A-Z0-9*~$=-]{8,34}$/;
const ID=/^[A-Za-z0-9_-]{1,64}$/;
const OP_ID=/^[A-Za-z0-9_-]{8,96}$/;
// The browser already commits customer-payment:<uuid>. Never re-key a paid op.
// This syntax is accepted ONLY for the explicit customer-payment contract.
const CUSTOMER_PAYMENT_OP_ID=/^customer-payment:[A-Za-z0-9_-]{8,79}$/;
const MAX_AMOUNT=10_000_000_000;
function validate(command){
  if(!command||typeof command!=='object'||Array.isArray(command))return null;
  const contract=KINDS[command.kind];
  if(!contract || !LICENSE.test(command.license||'') ||
     !(contract.customerPayment
       ? CUSTOMER_PAYMENT_OP_ID.test(command.opId||'')
       : OP_ID.test(command.opId||'')))
    return null;
  const required=['opId','license','kind',contract.detail,'amountCents',...(contract.quantity?['quantity']:[])];
  // Unknown keys are denied rather than accidentally storing PINs, contacts or
  // client-asserted roles. Only a typed, finite, nonnegative amount is accepted.
  if(Object.keys(command).length!==required.length ||
     !Object.keys(command).every(k=>required.includes(k)) ||
     !ID.test(command[contract.detail]||'') ||
     !Number.isSafeInteger(command.amountCents) ||
     command.amountCents<0 || command.amountCents>MAX_AMOUNT ||
     (contract.customerPayment && command.amountCents===0) ||
     (contract.quantity && (!Number.isSafeInteger(command.quantity)||command.quantity<1||command.quantity>10000)))
    return null;
  // Canonical order means identical operations hash to identical bytes regardless
  // of caller's JSON property ordering.
  return {
    contract,
    record:{
      license:command.license,opId:command.opId,kind:command.kind,
      [contract.detail]:command[contract.detail],
      ...(contract.quantity?{quantity:command.quantity}:{}),
      amountCents:command.amountCents
    }
  };
}
function fail(status,reason){return {ok:false,status,reason};}
function sha256Hex(buffer){
  return Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
}
export function createTypedCommercialLedger({sql,transactionSync,authorize,authorizeCustomer,clock=Date.now}={}){
  if(!sql||typeof sql.exec!=='function'||typeof transactionSync!=='function'||
     typeof authorize!=='function'||typeof clock!=='function')
    throw new TypeError('trusted server-only SQL storage and authorization are required');
  return Object.freeze({
    async submit({ticket,command}={}){
      const validated=validate(command);
      if(!validated)return fail(400,'invalid-command');
      if(typeof ticket!=='string'||ticket.length<8||ticket.length>4096)return fail(403,'not-authorized');
      // Always ask trusted server authority even for duplicate opIds, so a
      // revoked actor cannot read an old receipt with a stale capability.
      let auth;
      try{
        auth=await authorize({ticket,license:validated.record.license,scope:validated.contract.scope});
      }catch(_){return fail(503,'authority-unavailable');}
      const principal=auth?.principal;
      if(auth?.ok!==true||!principal||
         principal.license!==validated.record.license||
         typeof principal.subject!=='string'||!principal.subject||
         !Array.isArray(principal.scopes)||!principal.scopes.includes(validated.contract.scope))
        return fail(403,'not-authorized');
      // A browser's clienteId and locally-stored facts cannot prove tenant
      // ownership (the old IndexedDB namespace is app-scoped, not license-
      // scoped). Require an independent server-owned customer registry before
      // even LOOKING UP a payment inbox receipt, including on duplicate opIds.
      // No provider => fail closed. Never read a customer role from the command.
      if(validated.contract.customerPayment){
        if(typeof authorizeCustomer!=='function')
          return fail(503,'customer-authority-unavailable');
        let member;
        try{
          member=await authorizeCustomer({
            license:validated.record.license,
            clienteId:validated.record.clienteId,
            principal
          });
        }catch(_){return fail(503,'customer-authority-unavailable');}
        if(member!==true)return fail(403,'customer-not-authorized');
      }
      let digest,now;
      try{
        const bytes=new TextEncoder().encode(JSON.stringify(validated.record));
        digest=sha256Hex(await crypto.subtle.digest('SHA-256',bytes));
        now=clock();
        if(!Number.isSafeInteger(now)||now<0)throw new Error('clock invalid');
      }catch(_){return fail(503,'processing-unavailable');}
      try{
        // SQLite DO transaction synchronously guards read+insert+receipt on the
        // same storage instance. Atomicity of final stock/cash must be separately
        // established when a typed business executor is wired.
        return transactionSync(()=>{
          sql.exec('CREATE TABLE IF NOT EXISTS typed_commercial_ops (license TEXT NOT NULL, op_id TEXT NOT NULL, payload_hash TEXT NOT NULL, receipt_json TEXT NOT NULL, PRIMARY KEY (license, op_id))');
          // Keep the canonical command bytes in the same DO transaction as the
          // inbox receipt. A digest alone cannot be replayed after a crash.
          // Separate table preserves compatibility with existing receipt rows;
          // historical hash-only rows remain non-executable until recovered.
          sql.exec('CREATE TABLE IF NOT EXISTS typed_commercial_payloads (license TEXT NOT NULL, op_id TEXT NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY (license, op_id))');
          const existing=Array.from(sql.exec(
            'SELECT payload_hash, receipt_json FROM typed_commercial_ops WHERE license = ? AND op_id = ?',
            validated.record.license,validated.record.opId))[0];
          if(existing){
            if(existing.payload_hash!==digest)return fail(409,'operation-conflict');
            // Hash-only legacy rows (or a damaged companion row) cannot be
            // replayed safely. Never represent them as recoverable inbox ACKs.
            const saved=Array.from(sql.exec(
              'SELECT payload_json FROM typed_commercial_payloads WHERE license = ? AND op_id = ?',
              validated.record.license,validated.record.opId))[0];
            if(!saved || saved.payload_json!==JSON.stringify(validated.record))
              return fail(409,'operation-recovery-required');
            const receipt=JSON.parse(existing.receipt_json);
            if(receipt.stage!=='stored-for-application'||receipt.opId!==validated.record.opId||
               receipt.license!==validated.record.license||receipt.kind!==validated.record.kind)
              throw new Error('receipt corrupt');
            return {ok:true,status:200,duplicate:true,receipt};
          }
          const receipt=Object.freeze({
            stage:'stored-for-application',
            license:validated.record.license,opId:validated.record.opId,
            kind:validated.record.kind,
            receiptId:digest.slice(0,24),acceptedAt:now
          });
          sql.exec('INSERT INTO typed_commercial_ops (license, op_id, payload_hash, receipt_json) VALUES (?, ?, ?, ?)',
            validated.record.license,validated.record.opId,digest,JSON.stringify(receipt));
          // No duplicate writer: both rows commit or roll back together.
          sql.exec('INSERT INTO typed_commercial_payloads (license, op_id, payload_json) VALUES (?, ?, ?)',
            validated.record.license,validated.record.opId,JSON.stringify(validated.record));
          return {ok:true,status:200,duplicate:false,receipt};
        });
      }catch(_){return fail(503,'storage-unavailable');}
    }
  });
}
