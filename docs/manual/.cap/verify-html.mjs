import { chromium } from 'playwright';
const FILE='file://'+new URL('../workmap-실무활용-메뉴얼.html',import.meta.url).pathname;
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(FILE,{waitUntil:'networkidle'});
await p.waitForTimeout(800);
// broken images?
const imgs=await p.evaluate(()=>[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.naturalWidth>0})));
console.log('IMAGES total',imgs.length,'broken',imgs.filter(i=>!i.ok).map(i=>i.src));
await p.screenshot({path:new URL('../_preview-top.png',import.meta.url).pathname});
await b.close();
console.log('errors:',errs);
