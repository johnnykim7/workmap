import { test, expect } from '@playwright/test';
import fs from 'fs';
import { loginAsAdmin, enterWorkspace, createWorkItem, apiLogin, API_BASE, ADMIN } from './helpers';
import { EPICS, CHILDREN } from './data';

// 프로젝트의 기존 업무 title→key 맵(재실행 시 중복 생성 방지).
async function existingByTitle(request, token: string, projectId: number): Promise<Record<string, string>> {
  const res = await request.get(`${API_BASE}/work-items?projectId=${projectId}&size=500`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  const items = body?.data?.items ?? body?.data ?? [];
  const map: Record<string, string> = {};
  for (const it of items) map[it.title] = it.key;
  return map;
}

// EPIC 14개 먼저 → 하위(STORY/TASK/SUBTASK/BUG) 등록. 각 항목은 헤더 "만들기" 모달 반복.
// 생성 key는 .state.json에 누적(03-features에서 첨부/댓글/링크에 사용).
test.describe.configure({ mode: 'serial' });

const STATE_FILE = 'e2e/.state.json';
const PROJECT_NAME = '카페24 연동 개발 및 앱런칭';

function loadState(): any { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
function saveState(patch: Record<string, unknown>) {
  const cur = loadState();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...cur, ...patch }, null, 2));
}

// 프로젝트 컨텍스트 화면(/projects/RTN24/*)에서 만들기 모달을 열면 프로젝트가 잠긴다.
async function gotoProject(page) {
  const st = loadState();
  await loginAsAdmin(page);
  await enterWorkspace(page, '반품구조대');
  await page.goto(`/projects/${st.projectKey}`);
  await page.waitForTimeout(1200);
}

test('EPIC 14개 등록', async ({ page, request }) => {
  test.setTimeout(180_000);
  const st = loadState();
  const token = await apiLogin(request, ADMIN.email, ADMIN.password);
  const existing = await existingByTitle(request, token, st.projectId);
  await gotoProject(page);

  const keys: Record<string, string> = { ...(st.epicKeys ?? {}) };
  const todo = EPICS.filter((e) => !existing[e.title]);
  for (let i = 0; i < todo.length; i++) {
    const e = todo[i];
    const key = await createWorkItem(page, {
      projectName: PROJECT_NAME, type: e.type, title: e.title,
      assignee: e.assignee, priority: e.priority, labels: e.labels,
      desc: e.desc ? `${e.title} — 카페24 연동 관련 에픽. bp-channel 네이버 대비 미구현분 기준.` : undefined,
    }, { keepOpen: i < todo.length - 1 });
    if (key) keys[e.title] = key;
    console.log(`EPIC ${i + 1}/${todo.length}: ${e.title} → ${key}`);
  }
  // 기존 것 포함해 title→key 재구성
  const after = await existingByTitle(request, token, st.projectId);
  for (const e of EPICS) if (after[e.title]) keys[e.title] = after[e.title];
  saveState({ epicKeys: keys });
  expect(Object.keys(keys).length).toBeGreaterThanOrEqual(EPICS.length);
});

test('하위 항목(STORY/TASK/BUG) 등록 — SUBTASK 제외', async ({ page, request }) => {
  test.setTimeout(600_000);
  const st = loadState();
  const token = await apiLogin(request, ADMIN.email, ADMIN.password);
  const existing = await existingByTitle(request, token, st.projectId);
  await gotoProject(page);

  // SUBTASK는 모달로 생성 불가(부모 필수) → 03-features에서 상세 화면으로 추가.
  const targets = CHILDREN.filter((c) => c.type !== 'SUBTASK' && !existing[c.title]);
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    const key = await createWorkItem(page, {
      projectName: PROJECT_NAME, type: c.type, title: c.title,
      assignee: c.assignee, priority: c.priority, labels: c.labels, epicTitle: c.epic,
    }, { keepOpen: i < targets.length - 1 });
    console.log(`CHILD ${i + 1}/${targets.length}: [${c.type}] ${c.title} → ${key}`);
  }
  // 전체 title→key 재구성해서 저장(03에서 참조)
  const after = await existingByTitle(request, token, st.projectId);
  saveState({ allKeys: after });
  // SUBTASK 제외한 모든 항목이 존재해야 함
  const nonSub = CHILDREN.filter((c) => c.type !== 'SUBTASK');
  for (const c of nonSub) expect(after[c.title], `누락: ${c.title}`).toBeTruthy();
});
