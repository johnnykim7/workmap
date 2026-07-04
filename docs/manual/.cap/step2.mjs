import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186';
const SHOTS=new URL('../shots/',import.meta.url).pathname;
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2})).newPage();
await p.addInitScript(()=>{const s=document.createElement('style');s.textContent='[data-sonner-toaster]{display:none!important}';(document.head||document.documentElement).appendChild(s);});
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com');await p.fill('#password','admin1234');
await p.click('button[type=submit]');await p.waitForURL('**/select-workspace',{timeout:15000}).catch(()=>{});
await p.waitForTimeout(1000);await p.getByText('메뉴얼 예제').first().click();await p.waitForTimeout(1200);
await p.goto(`${BASE}/projects`,{waitUntil:'networkidle'});await p.waitForTimeout(1300);
await p.getByRole('button',{name:/프로젝트 만들기/}).first().click();await p.waitForTimeout(900);
// 개발형 카드 = 헤딩 "개발형"의 부모 button
const card=p.locator('button',{hasText:'개발형'}).first();
await card.click();await p.waitForTimeout(500);
// 다음 (footer 우측 primary)
await p.locator('div[role=dialog] button:has-text("다음")').click();await p.waitForTimeout(900);
await p.evaluate(()=>document.querySelectorAll('[data-sonner-toaster]').forEach(e=>e.remove()));
await p.screenshot({path:`${SHOTS}06-wizard-step2-nameKey.png`});
console.log('step2 captured; dialog text:');
console.log((await p.locator('div[role=dialog]').innerText()).slice(0,200));
await b.close();
