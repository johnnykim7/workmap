import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://59.8.160.12:3186';
const EMAIL = 'admin@workmap.com';
const PW = 'admin1234';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const logs = [];
page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('LOGIN PAGE URL:', page.url());
  await page.fill('#email', EMAIL);
  await page.fill('#password', PW);
  await page.click('button[type=submit]');
  await page.waitForTimeout(3000);
  console.log('AFTER LOGIN URL:', page.url());
  await page.screenshot({ path: new URL('./after-login.png', import.meta.url).pathname, fullPage: false });
  // dump visible text snippet
  const body = (await page.locator('body').innerText()).slice(0, 600);
  console.log('BODY SNIPPET:\n', body);
} catch (e) {
  console.log('ERROR:', e.message);
} finally {
  console.log('--- PAGE LOGS ---');
  console.log(logs.slice(0, 30).join('\n'));
  await browser.close();
}
