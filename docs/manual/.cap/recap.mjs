import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE || 'http://59.8.160.12:3186';
const SHOTS = new URL('../shots/', import.meta.url).pathname;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 토스트/알림배지 숨김 CSS 주입 (캡처 깔끔하게)
await page.addInitScript(() => {
  const css = `[data-sonner-toaster]{display:none !important}`;
  const apply = () => { const s = document.createElement('style'); s.textContent = css; document.head?.appendChild(s); };
  if (document.head) apply(); else document.addEventListener('DOMContentLoaded', apply);
});

async function shot(name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 800);
  // 혹시 남은 토스터 강제 제거
  await page.evaluate(() => document.querySelectorAll('[data-sonner-toaster]').forEach((e) => e.remove()));
  await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: !!opts.full });
  console.log('shot:', name);
}
async function go(path, wait = 1600) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(wait);
}
const clickText = async (t, opts = {}) => {
  await page.getByText(t, { exact: opts.exact ?? false }).first().click({ timeout: opts.timeout ?? 5000 }).catch((e) => console.log('clickText fail', t, e.message));
};

// 로그인
await go('/login', 1200);
await page.fill('#email', 'admin@workmap.com');
await page.fill('#password', 'admin1234');
await page.click('button[type=submit]');
await page.waitForURL('**/select-workspace', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
await clickText('메뉴얼 예제');
await page.waitForTimeout(1200);

// 재캡처: 토스트 가렸던 화면들
await go('/', 1800); await shot('03-home');
await go('/projects/SHOP/backlog', 1800); await shot('08-backlog', { full: true });
await go('/projects/SHOP/board', 1500);
// 보드 완료 컬럼까지 보이도록 약간 축소 뷰포트로 한 장 더
await shot('09-board');
await go('/work-items/SHOP-1', 1800); await shot('10-workitem-epic', { full: true });
await go('/work-items/SHOP-3', 1800); await shot('11-workitem-story', { full: true });
await go('/projects/SHOP/reports', 2000); await shot('13-reports', { full: true });
await go('/projects/SHOP/summary', 1600); await shot('14-summary');
await go('/projects/SHOP/list', 1600); await shot('15-list');
await go('/projects/SHOP/timeline', 1700); await shot('12-timeline');
await go('/projects/OPS/board', 1700); await shot('16-ops-board');
await go('/search', 1500); await shot('18-search');
await go('/inbox', 1500); await shot('19-inbox');
await go('/projects', 1500); await shot('04-projects');
await go('/select-workspace', 1400); await shot('02-select-workspace');

// 프로젝트 만들기 마법사 — step1 -> 개발형 -> 다음 -> step2
await go('/projects', 1400);
await page.getByRole('button', { name: '프로젝트 만들기' }).first().click().catch(() => clickText('프로젝트 만들기'));
await page.waitForTimeout(900);
await shot('05-wizard-step1-template');
await clickText('개발형');
await page.waitForTimeout(400);
await page.getByRole('button', { name: /다음/ }).click({ timeout: 4000 }).catch((e) => console.log('next fail', e.message));
await page.waitForTimeout(800);
await shot('06-wizard-step2-nameKey');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// 만들기 모달
await page.getByRole('button', { name: '만들기', exact: true }).first().click().catch(() => clickText('만들기', { exact: true }));
await page.waitForTimeout(1000);
await shot('07-create-modal');

console.log('recap done');
await browser.close();
