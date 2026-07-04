import { chromium } from 'playwright';
import fs from 'fs';
const BASE='http://59.8.160.12:3186';
const SHOTS=new URL('../shots/',import.meta.url).pathname;
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2})).newPage();
await p.addInitScript(()=>{const s=document.createElement('style');s.textContent='[data-sonner-toaster]{display:none!important}';(document.head||document.documentElement).appendChild(s);});
async function shot(n,full){await p.evaluate(()=>document.querySelectorAll('[data-sonner-toaster]').forEach(e=>e.remove()));await p.screenshot({path:`${SHOTS}${n}.png`,fullPage:!!full});console.log('shot',n);}
async function go(path,w=1600){await p.goto(`${BASE}${path}`,{waitUntil:'networkidle'}).catch(()=>{});await p.waitForTimeout(w);}
await go('/login',1200);
await p.fill('#email','admin@workmap.com');await p.fill('#password','admin1234');
await p.click('button[type=submit]');await p.waitForURL('**/select-workspace',{timeout:15000}).catch(()=>{});
await p.waitForTimeout(1000);await p.getByText('메뉴얼 예제').first().click();await p.waitForTimeout(1200);

// 채팅(워크룸)
await go('/chat',1800); await shot('20-chat');
// 캘린더
await go('/projects/OPS/calendar',1800); await shot('21-calendar');
// 관리자 - 측정단위
await go('/admin/measure-units',1600); await shot('22-admin-measure');
// 관리자 - 워크플로
await go('/admin/workflows',1800); await shot('23-admin-workflow');
// 관리자 - 업무유형
await go('/admin/issue-types',1600); await shot('24-admin-issuetypes');
// 관리자 - 양식
await go('/admin/forms',1600); await shot('25-admin-forms');
// 관리자 - 사용자
await go('/admin/users',1700); await shot('26-admin-users');
// 계정 - 알림설정
await go('/account/notifications',1600); await shot('27-account-notifications');
// 계정 - 테마
await go('/account/theme',1500); await shot('28-account-theme');
// 계정 - 비번변경
await go('/account/password',1400); await shot('29-account-password');
// 필드스킴
await go('/admin/field-schemes',1600); await shot('30-admin-fieldschemes');
await b.close();
console.log('ui shots done');
