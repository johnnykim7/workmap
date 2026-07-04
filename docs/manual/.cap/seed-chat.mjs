import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186', API='http://59.8.160.12:8186/api/v1';
const SHOTS=new URL('../shots/',import.meta.url).pathname;
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2})).newPage();
await p.addInitScript(()=>{const s=document.createElement('style');s.textContent='[data-sonner-toaster]{display:none!important}';(document.head||document.documentElement).appendChild(s);});
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com');await p.fill('#password','admin1234');
await p.click('button[type=submit]');await p.waitForURL('**/select-workspace',{timeout:15000}).catch(()=>{});
await p.waitForTimeout(1000);
const token=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('workmap-auth')).state.accessToken}catch{return null}});
const WS=4;
async function api(m,path,body){const r=await fetch(`${API}${path}`,{method:m,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>null);if(!r.ok||!j||j.success===false)throw new Error(`${m} ${path} ${r.status} ${JSON.stringify(j?.error)}`);return j.data;}
// 채널 생성 (없으면)
let chans=await api('GET',`/chat/channels?workspaceId=${WS}`);
let ch=chans.find(c=>c.name==='general');
if(!ch){ ch=await api('POST','/chat/channels',{workspaceId:WS,name:'general',displayName:'일반',description:'팀 공지·잡담 채널'}); }
let ch2=chans.find(c=>c.name==='dev');
if(!ch2){ ch2=await api('POST','/chat/channels',{workspaceId:WS,name:'dev',displayName:'개발',description:'쇼핑몰 리뉴얼 개발 논의'}); }
console.log('channels', ch.id, ch2?.id);
// 메시지
const msgs=await api('GET',`/chat/channels/${ch.id}/messages`);
if(msgs.length<2){
  await api('POST',`/chat/channels/${ch.id}/messages`,{workspaceId:WS,contentHtml:'<p>안녕하세요! 메뉴얼 예제 워크스페이스입니다 👋</p>'});
  await api('POST',`/chat/channels/${ch.id}/messages`,{workspaceId:WS,contentHtml:'<p>오늘 스프린트 데일리는 10시에 진행합니다.</p>'});
  const m3=await api('POST',`/chat/channels/${ch.id}/messages`,{workspaceId:WS,contentHtml:'<p>SHOP-3 간편결제 연동 PR 리뷰 부탁드려요 🙏</p>'});
  // 스레드 답글
  await api('POST',`/chat/channels/${ch.id}/messages/${m3.id}/replies`,{workspaceId:WS,contentHtml:'<p>네, 오후에 확인하겠습니다.</p>'});
  // 리액션
  await api('POST',`/chat/channels/${ch.id}/messages/${m3.id}/reactions`,{emoji:'👍'});
}
console.log('chat seeded');

// 재캡처
async function shot(n){await p.evaluate(()=>document.querySelectorAll('[data-sonner-toaster]').forEach(e=>e.remove()));await p.screenshot({path:`${SHOTS}${n}.png`});console.log('shot',n);}
await p.goto(`${BASE}/chat`,{waitUntil:'networkidle'});await p.waitForTimeout(2000);
await shot('20-chat');
await b.close();
