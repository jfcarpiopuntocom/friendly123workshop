"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http");
// Local npm test prerequisite: npx playwright install chromium (CI already installs it).
const {chromium}=require("playwright");
// E2 runtime was split out of index.html after v487; read the live authored JS.
const app=fs.readFileSync("src/app/app-inline-03.js","utf8");
const swOriginal=fs.readFileSync("docs/sw.js","utf8");
// Only the localhost fixture narrows SW precache. Production sw.js is untouched.
const sw=swOriginal.replace(/const SHELL = \[[\s\S]*?\n\];/,
  'const SHELL = ["./index.html","./dashboard.html","./app-fixture.min.js"];');
assert.notEqual(sw,swOriginal,"fixture must replace the real SW precache manifest");
const shellNow=(sw.match(/const CACHE = "(f123-shell-v[0-9]+)";/)||[])[1];
assert.ok(shellNow,"read the real release shell from sw.js");
const shellNext=shellNow+"-e2fixture";
const swNew=sw.replace(`const CACHE = "${shellNow}";`,`const CACHE = "${shellNext}";`);
assert.notEqual(swNew,sw,"updated SW fixture must change actual bytes");
const reg=app.split("\n").find(s=>s.includes('navigator.serviceWorker.register("./sw.js"'));
const helperStart=app.indexOf("function _recargarSeguroVersion() {");
const helperEnd=app.indexOf("\n}",helperStart)+2;
const start=app.indexOf("const _ocActSolaOn = true;");
const end=app.indexOf("// Microcirugia 5",start);
assert.ok(reg&&helperStart>0&&helperEnd>helperStart&&start>helperEnd&&end>start,
  "use actual E2 registration, safe-version helper and auto-update IIFE");
const safeReloadHelper=app.slice(helperStart,helperEnd);
const auto=app.slice(start,end);
assert.match(safeReloadHelper,/sessionStorage\.setItem\("f123_reload_al_entrar", "1"\)/,
  "fixture must extract the actual deferred-reload helper, not stub it");
function pageHtml(shell) {
  return '<!doctype html><title>Friendly test</title><body data-shell="'+shell+'"><main id="app">Synthetic notebook</main></body>';
}
async function esperar(check) {
  const stop=Date.now()+7000;
  do {
    const result=await check();
    if(result) return result;
    await new Promise(r=>setTimeout(r,35));
  }while(Date.now()<stop);
  throw Error("Service Worker state did not reach the expected condition");
}
test("E2 Chromium: update waits for app and dashboard, then opens one coherent shell", {timeout:50000},async()=>{
  let published=false;
  const server=http.createServer((req,res)=>{
    const route=new URL(req.url,"http://127.0.0.1").pathname;
    const shell=published?shellNext:shellNow;
    res.setHeader("Cache-Control","no-store");
    if(route==="/app/sw.js"){
      res.setHeader("Content-Type","text/javascript");
      return res.end(published?swNew:sw);
    }
    if(route==="/app/version.json"){
      res.setHeader("Content-Type","application/json");
      return res.end(JSON.stringify({version:"1.0",shell}));
    }
    if(route==="/app/index.html"||route==="/app/dashboard.html"||route==="/app/"||route==="/probe"){
      res.setHeader("Content-Type","text/html");
      return res.end(pageHtml(shell));
    }
    if(route==="/app/app-fixture.min.js"){
      res.setHeader("Content-Type","application/javascript");
      return res.end('/* '+shell+' */');
    }
    res.writeHead(404).end("Fixture only");
  });
  await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
  const origin="http://127.0.0.1:"+server.address().port+"/app/";
  let browser;
  try {
    browser=await chromium.launch({headless:true});
    const ctx=await browser.newContext({serviceWorkers:"allow"});
    const open=async target=>{
      const page=await ctx.newPage();
      await page.goto(origin+target,{waitUntil:"domcontentloaded",timeout:8000});
      return page;
    };
    const first=await open("index.html");
    assert.equal(await first.evaluate(async()=>{
      await navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"});
      await navigator.serviceWorker.ready;
      return !!navigator.serviceWorker.controller;
    }),false,"initial installation must not take over the in-progress page");
    await first.close();
    const appPage=await open("index.html");
    const dashboard=await open("dashboard.html");
    await appPage.addScriptTag({content:safeReloadHelper+'\n'+auto});
    await appPage.evaluate(()=>{
      sessionStorage.setItem("f123_sesion","synthetic-e2");
      window.OCSync={confirmarCatalogoDurable:async()=>false};
      document.getElementById("app").setAttribute("data-draft","2");
    });
    assert.equal(await dashboard.evaluate(()=>!!navigator.serviceWorker.controller),true);
    published=true;
    await appPage.evaluate(()=>window._ocActSola.revisar());
    await esperar(()=>appPage.evaluate(async()=>(await navigator.serviceWorker.getRegistration())?.waiting?.state==="installed"));
    assert.equal(await appPage.evaluate(async()=>{
      const waiting=(await navigator.serviceWorker.getRegistration()).waiting;
      return new Promise(resolve=>{
        const timeout=setTimeout(()=>{navigator.serviceWorker.removeEventListener("message",listen);resolve("");},1800);
        function listen(e){
          if(e.source!==waiting||e.data?.tipo!=="shell-actual")return;
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener("message",listen);
          resolve(e.data.shell);
        }
        waiting.postMessage({tipo:"skip-waiting"});
        navigator.serviceWorker.addEventListener("message",listen);
        waiting.postMessage({tipo:"que-shell"});
      });
    }),shellNext,"a v781 client can query the waiting worker but cannot force activation");
    assert.equal(await appPage.locator("#app").getAttribute("data-draft"),"2");
    assert.equal(await appPage.evaluate(()=>sessionStorage.getItem("f123_sesion")),"synthetic-e2");
    assert.equal(await appPage.locator("body").getAttribute("data-shell"),shellNow);
    assert.equal(await appPage.evaluate(async()=>await(await fetch("./app-fixture.min.js")).text()),"/* "+shellNow+" */");
    await appPage.close();
    assert.equal(await dashboard.evaluate(async()=>(await navigator.serviceWorker.getRegistration()).waiting?.state),"installed");
    assert.equal(await dashboard.locator("body").getAttribute("data-shell"),shellNow);
    await dashboard.close();
    // A page outside the scope can observe promotion without pinning the old shell.
    const monitor=await open("../probe");
    await esperar(()=>monitor.evaluate(async base=>{
      const r=await navigator.serviceWorker.getRegistration(base);
      return r?.active?.state==="activated"&&!r.waiting;
    },origin));
    await monitor.close();
    const nextApp=await open("?desde=whatsapp");
    const nextDash=await open("dashboard.html?return=qa");
    for(const page of [nextApp,nextDash]){
      assert.equal(await page.locator("body").getAttribute("data-shell"),shellNext);
      assert.equal(await page.evaluate(async()=>await(await fetch("./app-fixture.min.js")).text()),"/* "+shellNext+" */");
    }
  }finally{
    if(browser)await browser.close();
    server.closeAllConnections();
    await new Promise(ok=>server.close(ok));
  }
});
