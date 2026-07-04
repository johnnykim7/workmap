import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.BASE || 'http://59.8.160.12:3186';
const API = process.env.API || 'http://59.8.160.12:8186/api/v1';
const EMAIL = 'admin@workmap.com';
const PW = 'admin1234';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('#email', EMAIL);
await page.fill('#password', PW);
await page.click('button[type=submit]');
await page.waitForURL('**/select-workspace', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);

const token = await page.evaluate(() => {
  const raw = localStorage.getItem('workmap-auth');
  if (!raw) return null;
  try { return JSON.parse(raw)?.state?.accessToken ?? null; } catch { return null; }
});
if (!token) { console.log('NO TOKEN'); await browser.close(); process.exit(1); }

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j || j.success === false) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(j?.error)}`);
  }
  return j.data;
}

const out = {};

// 1) 메뉴얼 전용 워크스페이스
const ws = await api('POST', '/workspaces', { name: '메뉴얼 예제', description: 'WorkMap 사용 메뉴얼 캡처용 예제 워크스페이스' });
out.workspaceId = ws.id;
console.log('WS', ws.id, ws.name);

// 2) 개발형 프로젝트
const dev = await api('POST', '/projects', {
  workspaceId: ws.id, key: 'SHOP', name: '쇼핑몰 리뉴얼', templateId: 1, visibility: 'PUBLIC',
  startDate: '2026-06-01', endDate: '2026-08-31',
  description: '쇼핑몰 프론트/백엔드 리뉴얼 프로젝트(개발형 예제)',
});
out.devProjectId = dev.id; out.devKey = dev.key;
console.log('DEV PROJ', dev.id, dev.key);

// 3) 운영형 프로젝트
const ops = await api('POST', '/projects', {
  workspaceId: ws.id, key: 'OPS', name: 'CS 운영', templateId: 2, visibility: 'PUBLIC',
  description: '고객문의·장애 접수 운영(운영형 예제)',
});
out.opsProjectId = ops.id; out.opsKey = ops.key;
console.log('OPS PROJ', ops.id, ops.key);

// 4) 개발형: 에픽 2개
const epic1 = await api('POST', '/work-items', { projectId: dev.id, issueType: 'EPIC', title: '결제 시스템 개편', priority: 'HIGH', labels: ['payment'] });
const epic2 = await api('POST', '/work-items', { projectId: dev.id, issueType: 'EPIC', title: '상품 검색 고도화', priority: 'MEDIUM', labels: ['search'] });
out.epic1 = epic1.id; out.epic2 = epic2.id;
console.log('EPIC', epic1.id, epic2.id);

// 5) 에픽 하위 스토리/태스크
const mk = (t) => api('POST', '/work-items', t);
const s1 = await mk({ projectId: dev.id, issueType: 'STORY', title: '간편결제(카카오페이) 연동', epicId: epic1.id, priority: 'HIGH', labels: ['payment'] });
const s2 = await mk({ projectId: dev.id, issueType: 'STORY', title: '결제 실패 재시도 처리', epicId: epic1.id, priority: 'MEDIUM' });
const t1 = await mk({ projectId: dev.id, issueType: 'TASK', title: 'PG사 API 키 발급/환경설정', epicId: epic1.id, priority: 'MEDIUM' });
const s3 = await mk({ projectId: dev.id, issueType: 'STORY', title: '오타 교정 자동완성', epicId: epic2.id, priority: 'MEDIUM', labels: ['search'] });
const t2 = await mk({ projectId: dev.id, issueType: 'TASK', title: '검색 색인 배치 튜닝', epicId: epic2.id, priority: 'LOW' });
const b1 = await mk({ projectId: dev.id, issueType: 'BUG', title: '장바구니 합계 간헐 오류', priority: 'HIGH', labels: ['bug'] });
out.stories = [s1.id, s2.id, s3.id]; out.tasks = [t1.id, t2.id]; out.bug = b1.id;
console.log('STORIES/TASKS/BUG created');

// 6) 스프린트 생성 + 일부 항목 편입 + 시작
const sp1 = await api('POST', `/projects/${dev.id}/sprints`, { name: 'Sprint 1', goal: '간편결제 1차 오픈', startDate: '2026-06-23', endDate: '2026-07-06' });
out.sprint1 = sp1.id;
console.log('SPRINT', sp1.id, sp1.name);
// 스프린트에 항목 담기 (스토리1,2 + 태스크1)
for (const id of [s1.id, s2.id, t1.id]) {
  await api('PATCH', `/work-items/${id}/sprint`, { sprintId: sp1.id });
}
// 스프린트 시작
await api('POST', `/sprints/${sp1.id}/start`, {});
console.log('SPRINT started');

// 7) 보드에 진행 상태 만들기 위해 일부 상태 전이 (워크플로 상태 id 조회)
// 상태 전이는 toStatusId가 필요 → 프로젝트 board에서 가용 상태 확인
let boardStatuses = [];
try {
  const board = await api('GET', `/projects/${dev.id}/board`);
  // board.columns: [{statusId, name, items:[]}] 형태 추정 — 구조 출력
  out._boardSample = JSON.stringify(board).slice(0, 1200);
} catch (e) { out._boardErr = e.message; }

// 8) 운영형: 업무 몇 건
await mk({ projectId: ops.id, issueType: 'TASK', title: '[문의] 환불 절차 안내 요청', priority: 'MEDIUM' });
await mk({ projectId: ops.id, issueType: 'BUG', title: '[장애] 모바일 로그인 간헐 실패', priority: 'HIGHEST' });
await mk({ projectId: ops.id, issueType: 'TASK', title: '[요청] 대량 송장 출력 개선', priority: 'LOW' });
console.log('OPS items created');

fs.writeFileSync(new URL('./seed-out.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('SEED OUT:', JSON.stringify(out, null, 2));
await browser.close();
