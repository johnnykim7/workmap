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
// 개발형 카드: 헤딩 텍스트 클릭
await p.locator('div[role=dialog]').getByText('개발 프로젝트',{exact:false}).click();await p.waitForTimeout(500);
// "다음" 버튼을 textContent로 정확히 찾아 클릭 (evaluate)
const clicked=await p.evaluate(()=>{
  const dlg=document.querySelector('div[role=dialog]');
  const btns=[...dlg.querySelectorAll('button')];
  const next=btns.find(x=>x.textContent.trim().startsWith('다음'));
  if(next){next.click();return true;}
  return false;
});
console.log('next clicked:',clicked);
await p.waitForTimeout(1000);
await p.evaluate(()=>document.querySelectorAll('[data-sonner-toaster]').forEach(e=>e.remove()));
await p.screenshot({path:`${SHOTS}06-wizard-step2-nameKey.png`});
console.log('TEXT:',(await p.locator('div[role=dialog]').innerText()).replace(/\n/g,' | ').slice(0,160));
await b.close();
