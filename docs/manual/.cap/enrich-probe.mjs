import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186', API='http://59.8.160.12:8186/api/v1';
const b=await chromium.launch(); const ctx=await b.newContext(); const p=await ctx.newPage();
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com'); await p.fill('#password','admin1234');
await p.click('button[type=submit]'); await p.waitForTimeout(1500);
const token=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('workmap-auth')).state.accessToken}catch{return null}});
async function api(m,path,body){const r=await fetch(`${API}${path}`,{method:m,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>null);if(!r.ok||!j||j.success===false)throw new Error(`${m} ${path} ${r.status} ${JSON.stringify(j?.error)}`);return j.data;}
const board=await api('GET','/projects/5/board');
console.log('COLUMNS:', board.columns.map(c=>({statusId:c.statusId,code:c.code,label:c.label,isDone:c.isDone})));
// members of project 5
try{const m=await api('GET','/projects/5/members');console.log('MEMBERS:',JSON.stringify(m).slice(0,500));}catch(e){console.log('members err',e.message);}
await b.close();
