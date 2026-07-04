import { chromium } from 'playwright';
const BASE='http://59.8.160.12:3186', API='http://59.8.160.12:8186/api/v1';
const b=await chromium.launch(); const p=await (await b.newContext()).newPage();
await p.goto(`${BASE}/login`,{waitUntil:'networkidle'});
await p.fill('#email','admin@workmap.com'); await p.fill('#password','admin1234');
await p.click('button[type=submit]'); await p.waitForTimeout(1500);
const token=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('workmap-auth')).state.accessToken}catch{return null}});
async function api(m,path){const r=await fetch(`${API}${path}`,{headers:{Authorization:`Bearer ${token}`}});const j=await r.json();return j.data;}
const r=await api('GET','/work-items?projectId=5&size=200');
for(const w of r.items){ console.log(w.id, w.key, w.issueType, w.title); }
await b.close();
