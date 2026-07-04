import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE || 'http://59.8.160.12:3186';
const SHOTS = new URL('../shots/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const done = [];
async function shot(name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 700);
  await page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: !!opts.full });
  done.push(name);
  console.log('shot:', name);
}
async function go(path, wait = 1500) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(wait);
}
const clickText = async (t, opts={}) => {
  await page.getByText(t, { exact: opts.exact ?? false }).first().click({ timeout: opts.timeout ?? 5000 }).catch((e)=>console.log('clickText fail', t, e.message));
};

// ── 로그인 ──
await go('/login', 1200);
await page.fill('#email', 'admin@workmap.com');
await page.fill('#password', 'admin1234');
await shot('01-login');
await page.click('button[type=submit]');
await page.waitForURL('**/select-workspace', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);

// ── 워크스페이스 선택 ──
await shot('02-select-workspace');
// 메뉴얼 예제 WS 진입
await clickText('메뉴얼 예제', { exact: false });
await page.waitForTimeout(1500);

// ── 회사 홈 ──
await go('/', 1800);
await shot('03-home');

// ── 프로젝트 목록 ──
await go('/projects', 1500);
await shot('04-projects');

// ── 프로젝트 만들기 마법사 (모달) ──
await clickText('프로젝트 만들기');
await page.waitForTimeout(900);
await shot('05-wizard-step1-template');
// 개발형 카드 선택 후 다음
await clickText('개발형');
await page.waitForTimeout(400);
await clickText('다음');
await page.waitForTimeout(700);
await shot('06-wizard-step2-nameKey');
// 닫기 (Esc)
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// ── 만들기 모달 (업무/에픽 생성 폼) ──
// 헤더 [만들기] 버튼
await clickText('만들기', { exact: true });
await page.waitForTimeout(900);
await shot('07-create-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// ── 백로그 (개발형 SHOP) ──
await go('/projects/SHOP/backlog', 1800);
await shot('08-backlog', { full: true });

// ── 보드(칸반) ──
await go('/projects/SHOP/board', 1800);
await shot('09-board');

// ── 업무 상세: 에픽 (하위 진행률) ──
await go('/work-items/SHOP-1', 1800); // EPIC1=결제 시스템 개편 (key 추정)
await shot('10-workitem-epic', { full: true });

// ── 업무 상세: 스토리 ──
await go('/work-items/SHOP-3', 1800);
await shot('11-workitem-story', { full: true });

// ── 타임라인 ──
await go('/projects/SHOP/timeline', 1800);
await shot('12-timeline');

// ── 보고서(번다운/벨로시티) ──
await go('/projects/SHOP/reports', 2000);
await shot('13-reports', { full: true });

// ── 요약 ──
await go('/projects/SHOP/summary', 1600);
await shot('14-summary');

// ── 목록 뷰 ──
await go('/projects/SHOP/list', 1600);
await shot('15-list');

// ── 운영형 프로젝트 보드 ──
await go('/projects/OPS/board', 1800);
await shot('16-ops-board');

// ── 운영형 승인 ──
await go('/projects/OPS/approvals', 1600);
await shot('17-ops-approvals');

// ── 검색 ──
await go('/search', 1600);
await shot('18-search');

// ── 받은함 ──
await go('/inbox', 1500);
await shot('19-inbox');

fs.writeFileSync(`${SHOTS}_index.json`, JSON.stringify(done, null, 2));
console.log('TOTAL', done.length);
await browser.close();
