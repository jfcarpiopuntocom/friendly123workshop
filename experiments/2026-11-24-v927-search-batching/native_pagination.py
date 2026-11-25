from pathlib import Path
import json, sys
from playwright.sync_api import sync_playwright
src=Path(sys.argv[1]).read_text()
if 'function resumenComisionesGlobalHtml(' in src:
    start=src.index('function filtrarComisionesGlobal(')
    src=src[start:src.index('// Retain the original receipt breakdown',start)]
h=2166136261
for c in src: h=((h^ord(c))*16777619)&0xffffffff
assert (len(src),h)==(5359,809138631), (len(src),h)
fixture=r'''({multi,lang})=>{
 document.documentElement.lang=lang;
 document.body.innerHTML='<main id="listaComisiones"><div id="comm-product-count"></div><section data-commissions-current-view="producto"><div id="comm-groups-container" data-comm-groups-container></div><div data-comm-more-wrap><button id="more">More</button></div></section></main>';
 const box=document.getElementById('comm-groups-container');
 const groups=Array.from({length:1200},(_,i)=>({id:'p'+i,label:i===65?'Needle':'Product '+i}));
 window.escHtml=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
 const renderSlice=gs=>gs.map(g=>'<details data-comm-history-group data-comm-group="'+escHtml(g.id)+'" data-search="'+escHtml(g.label)+'"><summary>'+g.label+'</summary></details>').join('');
 window._ocComHistoryGroup='producto';window._ocComHistoryGroups=multi?['producto','cliente']:['producto'];window._ocComBatchSize=60;window._ocComHistoryRowsPorGrupo=new Map();window._ocComGroupsTotal=1200;
 window._ocComGroupState={producto:{view:{groups},mounted:60,total:1200,metaByGroup:new Map(),renderSlice,rowsByGroup:new Map(groups.map(g=>[g.id,[]]))}};
 box.innerHTML=renderSlice(groups.slice(0,60));
 const stats=()=>{const cards=[...box.querySelectorAll('[data-comm-history-group]')];const key=c=>{const k=c.dataset.commGroup;return k.startsWith('[')?JSON.parse(k)[1]:k;};return {count:cards.length,duplicates:cards.length-new Set(cards.map(key)).size,visible:cards.filter(c=>!c.hidden).map(key)};};
 filtrarComisionesGlobal('Needle');const initial=stats();
 mostrarMasGruposComisiones(document.getElementById('more'),'producto');const paged=stats();
 for(let i=0;i<20;i++){filtrarComisionesGlobal('Needle');filtrarComisionesGlobal('Product');filtrarComisionesGlobal('not-found');filtrarComisionesGlobal('Needle');}
 const repeated=stats();filtrarComisionesGlobal('');const cleared=stats();
 return {initial,paged,repeated,cleared};
}'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    print('Chromium',b.version)
    def run(code):
        results=[]
        for multi in [False,True]:
            for lang in ['es','en']:
                page=b.new_page();page.route('**/*',lambda route:route.abort());page.set_content('<html><body></body></html>');page.add_script_tag(content=code);r=page.evaluate(fixture,dict(multi=multi,lang=lang));page.close()
                results.append(dict(multi=multi,lang=lang,dup=r['paged']['duplicates'],visible=len(r['paged']['visible']),checks=[r['initial']['visible']==['p65'],r['paged']['duplicates']==0,r['paged']['visible']==['p65'],r['repeated']['duplicates']==0,r['repeated']['visible']==['p65'],r['cleared']['count']==120,len(r['cleared']['visible'])==120]))
        return results
    before=run(src);print('RED',json.dumps(before));assert all(x['dup']==1 and x['visible']==61 for x in before)
    old='    cont.insertAdjacentHTML("beforeend",html);\n  }\n  const remaining='
    assert src.count(old)==1
    fixed=src.replace(old,'    cont.insertAdjacentHTML("beforeend",html);\n    if(window._ocBuscaComisionProducto)filtrarComisionesGlobal(window._ocBuscaComisionProducto);\n  }\n  const remaining=')
    after=run(fixed);print('GREEN',json.dumps(after));assert all(all(x['checks']) for x in after)
    b.close()
