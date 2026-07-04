import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186', API='http://59.8.160.12:8186/api/v1';
const b=await chromium.launch(); const ctx=await b.newContext(); const p=await ctx.newPage();
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com'); await p.fill('#password','admin1234');
await p.click('button[type=submit]'); await p.waitForTimeout(1500);
const token=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('workmap-auth')).state.accessToken}catch{return null}});
async function api(m,path,body){const r=await fetch(`${API}${path}`,{method:m,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>null);if(!r.ok||!j||j.success===false)throw new Error(`${m} ${path} ${r.status} ${JSON.stringify(j?.error)}`);return j.data;}

// 담당자 배정 + 스토리포인트
const assign=(id)=>api('PATCH',`/work-items/${id}/assignee`,{assigneeId:1});
const sp=(id,v)=>api('PATCH',`/work-items/${id}`,{storyPoints:v});
for(const id of [20,21,22,23,24,25]) { await assign(id).catch(e=>console.log('assign',id,e.message)); }
await sp(20,5); await sp(21,3); await sp(22,2); // 스프린트 항목 13pt

// 상태 전이: 20 -> 진행중(3), 22 -> 완료(5). 21은 할일 유지.
// 전이는 화이트리스트 경유라 단계적으로
async function move(id, chain){ for(const to of chain){ await api('PATCH',`/work-items/${id}/status`,{toStatusId:to}).catch(e=>console.log('move',id,to,e.message)); } }
await move(20,[2,3]);       // 할일->선택됨->진행중
await move(22,[2,3,4,5]);   // ->완료
console.log('enrich done');
const board=await api('GET','/projects/5/board');
console.log('AFTER:', board.columns.map(c=>`${c.label}:${c.cards.length}`).join(' | '));
await b.close();
