import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186';
const SHOTS=new URL('../shots/',import.meta.url).pathname;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});
const p=await ctx.newPage();
await p.addInitScript(()=>{const s=document.createElement('style');s.textContent='[data-sonner-toaster]{display:none!important}';(document.head||document.documentElement).appendChild(s);});
async function shot(n){await p.evaluate(()=>document.querySelectorAll('[data-sonner-toaster]').forEach(e=>e.remove()));await p.screenshot({path:`${SHOTS}${n}.png`});console.log('shot',n);}
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com');await p.fill('#password','admin1234');
await p.click('button[type=submit]');await p.waitForURL('**/select-workspace',{timeout:15000}).catch(()=>{});
await p.waitForTimeout(1000);
await p.getByText('메뉴얼 예제').first().click();await p.waitForTimeout(1200);

// 만들기 모달(업무 생성 폼) — 헤더 [+ 만들기] 버튼
await p.goto(`${BASE}/projects/SHOP/board`,{waitUntil:'networkidle'});await p.waitForTimeout(1500);
await p.getByRole('button',{name:/만들기/}).first().click().catch(e=>console.log('create btn',e.message));
await p.waitForTimeout(1200);
await shot('07-create-modal');
await p.keyboard.press('Escape');await p.waitForTimeout(600);

// 프로젝트 마법사
await p.goto(`${BASE}/projects`,{waitUntil:'networkidle'});await p.waitForTimeout(1300);
await p.getByRole('button',{name:/프로젝트 만들기/}).first().click().catch(e=>console.log('wiz btn',e.message));
await p.waitForTimeout(900);
await shot('05-wizard-step1-template');
// 개발형 카드 클릭 (dialog 내부 button)
const dlg=p.getByRole('dialog');
await dlg.getByText('개발형',{exact:true}).first().click().catch(e=>console.log('dev card',e.message));
await p.waitForTimeout(400);
// 다음 버튼 — dialog footer
await dlg.getByRole('button',{name:/다음/}).click({timeout:5000}).catch(e=>console.log('next',e.message));
await p.waitForTimeout(800);
await shot('06-wizard-step2-nameKey');
await b.close();
console.log('done');
