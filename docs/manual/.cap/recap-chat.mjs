import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186';
const SHOTS=new URL('../shots/',import.meta.url).pathname;
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2})).newPage();
await p.addInitScript(()=>{const s=document.createElement('style');s.textContent='[data-sonner-toaster]{display:none!important}';(document.head||document.documentElement).appendChild(s);});
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com');await p.fill('#password','admin1234');
await p.click('button[type=submit]');await p.waitForURL('**/select-workspace',{timeout:15000}).catch(()=>{});
await p.waitForTimeout(1000);
await p.getByText('메뉴얼 예제').first().click();await p.waitForTimeout(1500);
// LNB 워크룸 클릭
await p.getByText('워크룸',{exact:false}).first().click().catch(()=>{});
await p.waitForTimeout(1500);
// 채널 '일반' 클릭
await p.getByText('일반',{exact:false}).first().click().catch(e=>console.log('chan click',e.message));
await p.waitForTimeout(1800);
await p.evaluate(()=>document.querySelectorAll('[data-sonner-toaster]').forEach(e=>e.remove()));
await p.screenshot({path:`${SHOTS}20-chat.png`});
console.log('url',p.url());
console.log((await p.locator('body').innerText()).slice(0,200).replace(/\n/g,' | '));
await b.close();
