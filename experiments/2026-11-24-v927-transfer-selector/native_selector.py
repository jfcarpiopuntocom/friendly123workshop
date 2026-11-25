from pathlib import Path
import sys,json
from playwright.sync_api import sync_playwright
src=Path(sys.argv[1]).read_text()
if 'async function ocMontarTraslado(' in src:
    a=src.index('  selFrom.addEventListener("change"',src.index('async function ocMontarTraslado('));src=src[a:src.index('  host.querySelector("[data-move-go]")',a)]
h=2166136261
for c in src:h=((h^ord(c))*16777619)&0xffffffff
assert (len(src),h)==(286,696673174),(len(src),h)
fixture=r'''({code,id,stock})=>{
 document.body.innerHTML='<select id="from"><option value="A">A</option><option value="B">B</option></select><select id="item"></select>';
 const selFrom=document.querySelector('#from'),selItem=document.querySelector('#item');
 const prods=[{id,nombre:'Producto & café',stockActual:stock,ubicacionId:'A'},...Array.from({length:1199},(_,i)=>({id:'p'+i,nombre:'P'+i,stockActual:1,ubicacionId:'A'})),{id:'other',nombre:'Other',stockActual:1,ubicacionId:'B'}];
 const escHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 new Function('selFrom','selItem','prods','escHtml',code)(selFrom,selItem,prods,escHtml);
 const change=v=>{selFrom.value=v;selFrom.dispatchEvent(new Event('change'));};
 change('A');const first=selItem.options[1];selItem.selectedIndex=1;
 const a={count:selItem.options.length,exactId:selItem.value===id,exactText:first.textContent==='Producto & café ('+stock+')',noInjected:!selItem.querySelector('[data-injected]')};
 change('B');const b=selItem.options.length===2&&selItem.options[1].value==='other'&&selItem.value==='';
 change('A');const c=selItem.options.length===1201&&selItem.value==='';
 return {...a,b,c,ok:a.count===1201&&a.exactId&&a.exactText&&a.noInjected&&b&&c};
}'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);print('Chromium',b.version)
    cases=[('normal',3),('A&B',3),('A"B',3),("A'B",3),('<A>',3),('A" data-injected="1',3),('A&amp;B',3),('Unicode Ñ',3),('normal','<b>2</b>')]
    def run(code):
        result=[]
        for id,stock in cases:
            page=b.new_page();page.route('**/*',lambda r:r.abort());page.set_content('<html><body></body></html>');r=page.evaluate(fixture,dict(code=code,id=id,stock=stock));page.close();result.append(dict(id=id,stock=stock,**r))
        return result
    before=run(src);print('RED',sum(r['ok'] for r in before),'/',len(before),json.dumps(before,ensure_ascii=False));assert sum(r['ok'] for r in before)==5
    fixed=src.replace('$'+'{p.id}', '$'+'{escHtml(p.id)}').replace('$'+'{p.stockActual}', '$'+'{escHtml(p.stockActual)}')
    assert fixed!=src
    after=run(fixed);print('GREEN',sum(r['ok'] for r in after),'/',len(after),json.dumps(after,ensure_ascii=False));assert all(r['ok'] for r in after);b.close()
