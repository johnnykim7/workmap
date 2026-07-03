import { Page, expect, APIRequestContext } from '@playwright/test';

// ── 운영 계정 (workmap-test-accounts 메모리) ──
export const ADMIN = { email: 'admin@workmap.com', password: 'admin1234' };
export const USERS = {
  dev1: { id: 11, email: 'dev1@workmap.com', name: '개발자1' },
  dev2: { id: 12, email: 'dev2@workmap.com', name: '개발자2' },
  dev3: { id: 13, email: 'dev3@workmap.com', name: '개발자3' },
  pm: { id: 14, email: 'pm@workmap.com', name: 'PM' },
};
export const API_BASE = 'http://59.8.160.12:8186/api/v1';

// ── 로그인 → (필요 시 WS 선택) → AppShell 진입 ──
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill(ADMIN.email);
  await page.locator('#password').fill(ADMIN.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
}

// WS 선택 화면이면 지정 WS 카드를 골라 AppShell(/)로 진입. 이미 / 이면 통과.
export async function enterWorkspace(page: Page, wsName: string) {
  await page.waitForTimeout(800);
  if (page.url().includes('/select-workspace') || (await page.getByRole('button', { name: /워크스페이스 만들기/ }).count())) {
    const card = page.getByRole('button', { name: new RegExp(escapeRe(wsName)) }).first();
    await card.click();
    await page.waitForURL((u) => u.pathname === '/', { timeout: 15_000 });
  }
  await page.waitForTimeout(800);
}

// WS 스위처로 현재 WS를 바꾼다(AppShell 헤더). 없으면 select-workspace 경유.
export async function switchWorkspace(page: Page, wsName: string) {
  // 헤더 WS 스위처(현재 WS 이름 버튼) 클릭 → 메뉴에서 대상 선택
  const switcher = page.getByRole('button', { name: new RegExp(escapeRe(wsName)) }).first();
  // 이미 그 WS면 아무 것도 안 함
  const header = page.locator('header, [data-slot="sidebar"]');
  if (await switcher.count()) return;
  // 스위처를 못 찾으면 select-workspace로 이동해 선택
  await page.goto('/select-workspace');
  await enterWorkspace(page, wsName);
}

// ── Radix Select: 다이얼로그 내 combobox를 열고 옵션 텍스트로 선택 ──
export async function selectByLabel(page: Page, trigger, optionName: string | RegExp) {
  await trigger.click();
  await page.waitForTimeout(200);
  const opt = page.getByRole('option', { name: typeof optionName === 'string' ? new RegExp(escapeRe(optionName)) : optionName }).first();
  await opt.click();
  await page.waitForTimeout(150);
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 업무 유형 코드 → UI 라벨 (domain.ts ISSUE_TYPE_LABEL 실측)
export const TYPE_LABEL: Record<string, string> = {
  EPIC: 'Epic', STORY: 'Story', TASK: 'Task', BUG: 'Bug', DOC: 'Doc', SUBTASK: 'Sub-task',
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGHEST: '최우선', HIGH: '높음', MEDIUM: '보통', LOW: '낮음', LOWEST: '최하',
};

// 헤더 "만들기" → 업무 만들기 모달을 열고, 한 항목을 등록한다.
// keepOpen이면 "다른 항목 만들기" 체크로 모달을 유지(연속 등록). 반환 = 생성된 업무 key.
export async function createWorkItem(
  page: Page,
  item: {
    projectName: string; // Select에서 프로젝트 식별용(이름 포함 텍스트)
    type: string;        // EPIC/STORY/...
    title: string;
    assignee?: string | null;  // 담당자 이름
    priority?: string;
    labels?: string[];
    epicTitle?: string;  // 부모 EPIC title(연결)
    desc?: string;       // 설명(리치에디터)
  },
  opts: { alreadyOpen?: boolean; keepOpen?: boolean } = {},
): Promise<string | null> {
  if (!opts.alreadyOpen) {
    await page.getByRole('button', { name: '만들기', exact: true }).click();
  }
  const d = page.getByRole('dialog');
  await expect(d.getByRole('heading', { name: /만들기/ })).toBeVisible();

  // combobox 순서: 0=프로젝트 1=유형 2=담당자 3=우선순위 4=Epic
  const combos = d.getByRole('combobox');

  // 프로젝트 — 이미 컨텍스트로 잠겨있으면(disabled) 스킵
  const projTrigger = combos.nth(0);
  if (await projTrigger.isEnabled()) {
    await selectByLabel(page, projTrigger, item.projectName);
  }
  // 유형
  await selectByLabel(page, combos.nth(1), TYPE_LABEL[item.type] ?? item.type);

  // 요약
  await d.getByPlaceholder('무엇을 할 일인가요?').fill(item.title);

  // 설명(선택) — 리치에디터(ProseMirror)
  if (item.desc) {
    const editor = d.locator('.tiptap, .ProseMirror').first();
    if (await editor.count()) {
      await editor.click();
      await page.keyboard.type(item.desc);
    }
  }

  // 담당자(combobox 2) — 이름 옵션 선택
  if (item.assignee) {
    await selectByLabel(page, combos.nth(2), item.assignee);
  }
  // 우선순위(combobox 3)
  if (item.priority && item.priority !== 'MEDIUM') {
    await selectByLabel(page, combos.nth(3), PRIORITY_LABEL[item.priority]);
  }
  // Epic 연결(combobox 4)
  if (item.epicTitle) {
    await selectByLabel(page, combos.nth(4), new RegExp(escapeRe(item.epicTitle)));
  }
  // 라벨(콤마 구분)
  if (item.labels?.length) {
    await d.getByPlaceholder(/콤마로 구분/).fill(item.labels.join(', '));
  }

  // keepOpen 체크
  if (opts.keepOpen) {
    const chk = d.getByRole('checkbox');
    if (!(await chk.isChecked())) await chk.click();
  }

  // 제출 — POST 응답 대기로 성공/실패 확정
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/work-items') && r.request().method() === 'POST', { timeout: 20_000 }),
    d.getByRole('button', { name: '만들기', exact: true }).click(),
  ]);
  if (!resp.ok()) {
    throw new Error(`업무 생성 실패(${item.title}): ${resp.status()} ${await resp.text().catch(() => '')}`);
  }
  const created = (await resp.json())?.data;
  await page.waitForTimeout(400); // keepOpen 리셋 대기
  return created?.key ?? null;
}

// ── API 헬퍼 (초대 등 UI 검증 목적 아닌 전제 처리) ──
export async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, { data: { email, password } });
  const body = await res.json();
  if (!body?.data?.accessToken) throw new Error(`login failed for ${email}: ${JSON.stringify(body)}`);
  return body.data.accessToken;
}

export async function apiAddWsMember(request: APIRequestContext, token: string, wsId: number, userId: number) {
  const res = await request.post(`${API_BASE}/workspaces/${wsId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId },
  });
  return res.status();
}

export async function apiInviteProjectMember(request: APIRequestContext, token: string, projectId: number, userId: number, role = 'MEMBER') {
  const res = await request.post(`${API_BASE}/projects/${projectId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId, role },
  });
  return res.status();
}

// 프로젝트 key로 numeric id 조회(멤버 초대 API가 numeric id를 받음).
// WS 격리(BIZ-108) — workspaceId를 주면 그 WS 컨텍스트로 조회.
export async function apiFindProjectByKey(request: APIRequestContext, token: string, key: string, workspaceId?: number) {
  const q = workspaceId ? `?workspaceId=${workspaceId}` : '';
  const res = await request.get(`${API_BASE}/projects${q}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  const list = body?.data?.items ?? body?.data ?? [];
  return list.find((p: any) => p.key === key);
}

// WS 목록에서 이름으로 id 조회.
export async function apiFindWorkspaceByName(request: APIRequestContext, token: string, name: string) {
  const res = await request.get(`${API_BASE}/workspaces`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();
  const list = body?.data ?? [];
  return list.find((w: any) => w.name === name);
}
