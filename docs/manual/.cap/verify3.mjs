import { chromium } from 'playwright';
const FILE='file://'+new URL('../workmap-실무활용-메뉴얼.html',import.meta.url).pathname;
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:980,height:900},deviceScaleFactor:2})).newPage();
await p.goto(FILE,{waitUntil:'networkidle'});
// 에픽 형식 박스 부분만
const el=await p.locator('#writing h3').first();
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.screenshot({path:new URL('../_preview-epic-rule.png',import.meta.url).pathname,clip:{x:300,y:0,width:680,height:760}});
await b.close();
