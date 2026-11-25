from pathlib import Path
import sys,json
from playwright.sync_api import sync_playwright
s=Path(sys.argv[1]).read_text()
a=s.index('async function ocMontarTraslado('); b=s.find('function abrirGestorCategorias(',a); s=s[a:b if b>=0 else len(s)]
h=2166136261
for c in s:h=((h^ord(c))*16777619)&0xffffffff
assert (len(s),h)==(3717,1839602001),(len(s),h)
fixture=r'''async scenario=>{
 document.body.innerHTML='<div id="hostA"></div><div id="hostB"></div>';
 const a=document.getElementById('hostA'), b=document.getElementById('hostB');
 let permitted=true; const requests=[];
 window.OCAuth={puedeGestionar:()=>permitted};window.API='/fixture';
 window.escHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.fetch=url=>new Promise((resolve,reject)=>requests.push({url,resolve,reject}));
 const mutationCounts={A:0,B:0};const obs=new MutationObserver(records=>{for(const r of records){if(r.addedNodes.length)mutationCounts[r.target===a?'A':'B']++;}});obs.observe(a,{childList:true});obs.observe(b,{childList:true});
 const resolve=(i,id)=>{requests[i].resolve({json:async()=>[{id,nombre:id},{id:'destination',nombre:'Destination'}]});requests[i+1].resolve({json:async()=>Array.from({length:1200},(_,k)=>({id:id+'-'+k,nombre:'Item '+k,stockActual:k+1,ubicacionId:id}))});};
 const p=ocMontarTraslado('hostA');
 if(scenario==='normal'){resolve(0,'first');await p;}
 else if(scenario==='revoked'){permitted=false;resolve(0,'first');await p;}
 else if(scenario==='denied-remount'){permitted=false;await ocMontarTraslado('hostA');resolve(0,'first');await p;}
 else if(scenario==='replaced'){const newHost=document.createElement('div');newHost.id='hostA';a.replaceWith(newHost);resolve(0,'first');await p;}
 else if(scenario==='two-hosts'){const q=ocMontarTraslado('hostB');resolve(2,'second');await q;resolve(0,'first');await p;}
 else {const q=ocMontarTraslado('hostA');resolve(2,'latest');await q;resolve(0,'first');await p;}
 await Promise.resolve();obs.disconnect();
 const inspect=host=>{const sel=host.querySelector('[data-move-from]');if(!sel)return {id:null,count:0};sel.selectedIndex=1;sel.dispatchEvent(new Event('change'));return {id:sel.value,count:host.querySelector('[data-move-item]').options.length};};
 return {A:inspect(a),B:inspect(b),writes:mutationCounts,requests:requests.length};
}'''
scenarios=['normal','revoked','denied-remount','replaced','reverse','two-hosts']
expected={
'normal':('first',None,1,0),'revoked':(None,None,0,0),'denied-remount':(None,None,0,0),'replaced':(None,None,0,0),'reverse':('latest',None,1,0),'two-hosts':('first','second',1,1)}
def ok(case,r):
    a,b,wa,wb=expected[case]
    return r['A']=={'id':a,'count':1201 if a else 0} and r['B']=={'id':b,'count':1201 if b else 0} and r['writes']=={'A':wa,'B':wb}
with sync_playwright() as p:
    engine=sys.argv[2] if len(sys.argv)>2 else 'chromium'
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']) if engine=='chromium' else p.webkit.launch()
    print(engine,browser.version,flush=True)
    def run(src):
        results=[]
        for case in scenarios:
            page=browser.new_page();page.route('**/*',lambda r:r.abort());page.set_content('<html><body></body></html>');page.add_script_tag(content=src);r=page.evaluate(fixture,case);page.close();results.append(dict(case=case,ok=ok(case,r),**r))
        return results
    before=run(s);print('RED',json.dumps(before),flush=True);assert sum(x['ok'] for x in before)==2
    fixed='const _ocTrasladoRequests=new WeakMap();\n'+s.replace('  if (!host) return;','  if (!host) return;\n  const request={}; _ocTrasladoRequests.set(host,request);').replace('  const activas =','  if (_ocTrasladoRequests.get(host)!==request || document.getElementById(hostId)!==host || !window.OCAuth?.puedeGestionar?.()) return;\n  const activas =')
    after=run(fixed);print('GREEN',json.dumps(after),flush=True);assert all(x['ok'] for x in after);browser.close()
    print('PASS',sum(x['ok'] for x in before),'→',sum(x['ok'] for x in after),'/',len(after))
