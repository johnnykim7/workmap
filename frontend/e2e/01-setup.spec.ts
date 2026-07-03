import { test, expect } from '@playwright/test';
import fs from 'fs';
import {
  loginAsAdmin, enterWorkspace, selectByLabel, escapeRe,
  apiLogin, apiAddWsMember, apiInviteProjectMember,
  apiFindWorkspaceByName, apiFindProjectByKey,
  ADMIN, USERS,
} from './helpers';

// 순차 실행. WS "반품구조대" 생성 → 멤버 초대(API) → 프로젝트 "카페24 연동"(위저드) → 멤버 배정(API).
// 생성한 식별자(wsId, projectId, projectKey)는 e2e/.state.json에 남겨 다음 스펙이 쓴다.
test.describe.configure({ mode: 'serial' });

const WS_NAME = '반품구조대';
const PROJECT_NAME = '카페24 연동 개발 및 앱런칭';
const PROJECT_KEY = 'RTN24'; // CAFE24는 다른 WS(5)에 선점됨(전역 유니크) → 반품구조대-카페24 키
const STATE_FILE = 'e2e/.state.json';

function saveState(patch: Record<string, unknown>) {
  let cur: Record<string, unknown> = {};
  try { cur = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); } catch { /* first */ }
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...cur, ...patch }, null, 2));
}

test('WS "반품구조대" 생성 (없으면)', async ({ page, request }) => {
  const token = await apiLogin(request, ADMIN.email, ADMIN.password);
  const existing = await apiFindWorkspaceByName(request, token, WS_NAME);
  if (existing) {
    saveState({ wsId: existing.id, wsName: WS_NAME });
    test.info().annotations.push({ type: 'note', description: `WS 이미 존재 id=${existing.id}` });
    return;
  }

  await loginAsAdmin(page);
  // WS 선택 화면의 "워크스페이스 만들기"
  await page.getByRole('button', { name: /워크스페이스 만들기/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '워크스페이스 만들기' })).toBeVisible();
  await dialog.locator('input[placeholder="예: 물류 플랫폼"]').fill(WS_NAME);
  await dialog.locator('textarea').fill('카페24 셀러 연동 앱 개발 워크스페이스 (반품구조대)');
  await dialog.getByRole('button', { name: '만들기', exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  // 생성된 WS id 확보
  const ws = await apiFindWorkspaceByName(request, token, WS_NAME);
  expect(ws, 'WS가 생성 후 목록에 있어야 함').toBeTruthy();
  saveState({ wsId: ws.id, wsName: WS_NAME });
});

test('WS 멤버 초대 (dev1~3·PM, API)', async ({ request }) => {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const token = await apiLogin(request, ADMIN.email, ADMIN.password);
  for (const u of Object.values(USERS)) {
    const status = await apiAddWsMember(request, token, state.wsId, u.id);
    // 200/201 성공, 409(이미 멤버)도 허용
    expect([200, 201, 409]).toContain(status);
  }
});

test('프로젝트 "카페24 연동" 생성 (위저드, 없으면)', async ({ page, request }) => {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const token = await apiLogin(request, ADMIN.email, ADMIN.password);
  // WS 격리 — 반품구조대(state.wsId) 컨텍스트에서 조회
  const exists = await apiFindProjectByKey(request, token, PROJECT_KEY, state.wsId);
  if (exists) {
    saveState({ projectId: exists.id, projectKey: PROJECT_KEY });
    return;
  }

  await loginAsAdmin(page);
  await enterWorkspace(page, WS_NAME);
  await page.goto('/projects');
  await page.waitForTimeout(1000);
  // 페이지의 진입 버튼(위저드 제출 버튼과 이름이 같으므로 .first() = 페이지 버튼)
  await page.getByRole('button', { name: '프로젝트 만들기', exact: true }).first().click();
  const d = page.getByRole('dialog');
  await expect(d.getByRole('heading', { name: '프로젝트 만들기' })).toBeVisible();

  // Step0: 개발형 템플릿 선택 → 다음(활성화 대기)
  await d.getByRole('button', { name: /개발형/ }).first().click();
  const next = d.getByRole('button', { name: '다음', exact: true });
  await expect(next).toBeEnabled();
  await next.click();

  // Step1: 이름·키·워크스페이스
  await d.locator('#p-name').fill(PROJECT_NAME);
  await d.locator('#p-key').fill(PROJECT_KEY);
  await selectByLabel(page, d.locator('#p-ws'), WS_NAME);
  await expect(next).toBeEnabled();
  await next.click();

  // Step2: 설정 확인 → 다음
  await expect(d.getByText('업무 유형')).toBeVisible();
  await next.click();

  // Step3: 멤버 스킵, 가시성 공개(기본) → 제출. 제출 버튼은 다이얼로그 내부에만 있음.
  const submit = d.getByRole('button', { name: '프로젝트 만들기', exact: true });
  await expect(submit).toBeVisible();
  // 제출과 동시에 생성 POST 응답을 기다려 실패를 노출한다.
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/projects') && r.request().method() === 'POST', { timeout: 20_000 }),
    submit.click(),
  ]);
  expect(resp.ok(), `프로젝트 생성 POST 실패: ${resp.status()} ${await resp.text().catch(() => '')}`).toBeTruthy();
  // 생성 응답 body에서 직접 프로젝트 id 확보(WS 격리 조회 회피)
  const created = (await resp.json())?.data;
  expect(created?.id, '생성 응답에 프로젝트 id가 있어야 함').toBeTruthy();

  // 생성 후 프로젝트 상세로 이동(/projects/RTN24/...)
  await page.waitForURL(new RegExp(`/projects/${escapeRe(PROJECT_KEY)}`), { timeout: 20_000 });
  saveState({ projectId: created.id, projectKey: PROJECT_KEY });
});

test('프로젝트 멤버 배정 (dev1~3·MEMBER, PM·MANAGER, API)', async ({ request }) => {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  const token = await apiLogin(request, ADMIN.email, ADMIN.password);
  const roleOf = (id: number) => (id === USERS.pm.id ? 'MANAGER' : 'MEMBER');
  for (const u of Object.values(USERS)) {
    const status = await apiInviteProjectMember(request, token, state.projectId, u.id, roleOf(u.id));
    expect([200, 201, 409]).toContain(status);
  }
});
