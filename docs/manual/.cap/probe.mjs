import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://59.8.160.12:3186';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// login
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('#email', 'admin@workmap.com');
await page.fill('#password', 'admin1234');
await page.click('button[type=submit]');
await page.waitForURL('**/select-workspace', { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(1500);

// grab token from localStorage to query API directly
const token = await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    const v = localStorage.getItem(k);
    if (v && v.includes('eyJ')) return { key: k, val: v };
  }
  return null;
});
console.log('TOKEN STORE KEY:', token?.key);

// pick a workspace and go home
await page.getByText('데모 워크스페이스', { exact: false }).first().click().catch(()=>{});
await page.waitForTimeout(1500);
console.log('URL after ws pick:', page.url());

// go to projects
await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const projText = (await page.locator('body').innerText()).slice(0, 800);
console.log('PROJECTS PAGE:\n', projText);

await browser.close();
