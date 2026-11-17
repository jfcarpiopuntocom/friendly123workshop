import asyncio, hashlib, json, os, threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.async_api import async_playwright
import tempfile
os.chdir(tempfile.mkdtemp(prefix='f123-native-'))
open('index.html','w').write('<!doctype html><title>Synthetic QA</title>')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=HTTPServer(('127.0.0.1',0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
async def case(browser,source):
 context=await browser.new_context(service_workers='block')
 await context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(f'http://127.0.0.1:{server.server_port}/') else route.abort())
 a=await context.new_page(); b=await context.new_page()
 for p in (a,b): await p.goto(f'http://127.0.0.1:{server.server_port}/')
 await a.evaluate('''async()=>{const r=indexedDB.open('f123_outbox',1);r.onupgradeneeded=()=>r.result.createObjectStore('cola',{keyPath:'id'});const db=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});await new Promise((ok,no)=>{const t=db.transaction('cola','readwrite');t.objectStore('cola').put({id:'f123_sync_pending',blob:'A',guardado:1});t.oncomplete=ok;t.onerror=no});db.close()}''')
 for p in (a,b):
  await p.evaluate('''()=>{const original=indexedDB.open.bind(indexedDB);let first=true;indexedDB.open=function(...args){if(!first)return original(...args);first=false;const req={error:new Error('synthetic first open failure')};setTimeout(()=>req.onerror&&req.onerror(),0);return req}}''')
  await p.add_script_tag(content=source)
 await a.evaluate('()=>OCOutbox.leer()');await b.evaluate('()=>OCOutbox.leer()')
 assert await a.evaluate("()=>OCOutbox.guardar('B')") is True
 result=await b.evaluate('''async()=>{const x=await OCOutbox.leer();const ok=await OCOutbox.guardar(x+'+C');return {restored:x,stored:localStorage.getItem('f123_sync_pending'),ok}}''')
 await context.close();return result
async def main():
 baseline=open(os.environ['BASELINE_SOURCE']).read();candidate=open(os.environ['CANDIDATE_SOURCE']).read()
 assert hashlib.sha256(baseline.encode()).hexdigest()=='928457788fa4200067beccf0aff15e2e6588e09cf92a839292024f57c7d84166'
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  baseline_result=await case(browser,baseline); candidate_result=await case(browser,candidate)
  print(json.dumps({'baseline':baseline_result,'candidate':candidate_result}),flush=True)
  await browser.close()
  assert baseline_result['restored']=='B' and baseline_result['stored']=='B+C'
  assert candidate_result['restored']=='B' and candidate_result['stored'] in (None,'B+C'), 'candidate restored stale IDB in multi-tab recovery'
 server.shutdown()
asyncio.run(main())
