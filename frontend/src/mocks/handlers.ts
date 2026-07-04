// MSW 핸들러 — 실 BE 계약 미러(T3-2 §A~E). dev에서 BE 미기동 시 화면 동작 확인용.
// 응답은 ResponseDto<T>(code/message/data). 목록은 배열(BE List<Response>). 경로는 numeric id.
import { http, HttpResponse, delay } from 'msw';
import type { Project, UserRole } from '@/types/domain';
import {
  seedMembers, seedProjects, seedUsers, seedWorkspaces,
  type ProjectMemberRow,
} from './seed';

const BASE = '/api/v1';

let users = [...seedUsers];
let projects: Project[] = [...seedProjects];
let members: ProjectMemberRow[] = [...seedMembers];
let projectSeq = projects.length;

// bp-common-lib ResponseDto 실 형태: { success, data, error, timestamp }
const ok = <T>(data: T) => HttpResponse.json({ success: true, data, error: null });
const created = <T>(data: T) => HttpResponse.json({ success: true, data, error: null }, { status: 201 });
const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ success: false, data: null, error: { code, message } }, { status });

const publicUser = (u: (typeof seedUsers)[number]) => ({
  id: u.id, email: u.email, name: u.name, role: u.role, departmentId: u.departmentId, active: u.active,
});

function currentUser(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  const m = auth.match(/^Bearer mock\.(\d+)$/);
  if (!m) return null;
  return users.find((u) => u.id === Number(m[1])) ?? null;
}

// BIZ-108: PRIVATE 프로젝트는 멤버/생성자에게만.
function visibleTo(p: Project, userId: number): boolean {
  if (p.visibility === 'PUBLIC') return true;
  if (p.createdBy === userId) return true;
  return members.some((m) => m.projectId === p.id && m.userId === userId);
}

// ── 회사홈(§9.2) dev 미러용 mock work_items. 실 BE엔 work_items 테이블, 여기선 화면 확인용 최소 시드. ──
// 막힘 2 · 지연 2 · 미배정 2 가 보이도록 구성. dueDate는 과거(지연)/오늘/이번주로 혼합.
const dashItems = [
  { id: 901, key: 'WMP-101', projectId: 1, issueType: 'BUG', title: '결제 콜백 500 — 외부 PG 응답 지연', commonStatus: 'IN_PROGRESS', flagged: true, priority: 'HIGHEST', assigneeId: 1, dueDate: '2026-06-20', progress: 30, blockReason: 'PG사 점검 응답 대기' },
  { id: 902, key: 'WMP-102', projectId: 1, issueType: 'TASK', title: '배송 라벨 출력 정렬 깨짐', commonStatus: 'IN_PROGRESS', flagged: true, priority: 'HIGH', assigneeId: 2, dueDate: '2026-06-26', progress: 50, blockReason: '디자인 확정 대기' },
  { id: 903, key: 'WMP-103', projectId: 1, issueType: 'STORY', title: '재고 동기화 배치 누락 건 보정', commonStatus: 'IN_PROGRESS', flagged: false, priority: 'HIGH', assigneeId: 1, dueDate: '2026-06-22', progress: 60, blockReason: null },
  { id: 904, key: 'WMP-104', projectId: 1, issueType: 'TASK', title: '월말 정산 리포트 양식 변경', commonStatus: 'TODO', flagged: false, priority: 'MEDIUM', assigneeId: 3, dueDate: '2026-06-24', progress: 0, blockReason: null },
  { id: 905, key: 'WMP-105', projectId: 1, issueType: 'BUG', title: '알림 중복 발송 — 멱등키 미적용', commonStatus: 'TODO', flagged: false, priority: 'HIGH', assigneeId: null, dueDate: '2026-06-27', progress: 0, blockReason: null },
  { id: 906, key: 'WMP-106', projectId: 1, issueType: 'STORY', title: '고객사 SSO 연동 1차', commonStatus: 'TODO', flagged: false, priority: 'MEDIUM', assigneeId: null, dueDate: null, progress: 0, blockReason: null },
];
const pickDash = (kind: 'blocked' | 'delayed' | 'unassigned') => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (kind === 'blocked') return dashItems.filter((w) => w.flagged);
  if (kind === 'unassigned') return dashItems.filter((w) => w.assigneeId == null);
  return dashItems.filter((w) => w.dueDate && new Date(w.dueDate) < today && w.commonStatus !== 'DONE');
};
const pageOf = <T>(arr: T[], page: number, size: number) => ({
  items: arr.slice(page * size, page * size + size),
  totalCount: arr.length,
  page, pageSize: size, totalPages: Math.max(1, Math.ceil(arr.length / size)),
});

// ── 받은함(§받은함) dev 미러용 mock 알림. recipientId=수신자(currentUser와 매칭). ──
const seedInbox = [
  { id: 701, recipientId: 1, type: 'ASSIGNED', workItemId: 901, message: '업무가 배정되었습니다.', isRead: false, createdAt: '2026-06-27T09:10:00Z' },
  { id: 702, recipientId: 1, type: 'BLOCKED', workItemId: 902, message: '업무가 막혔습니다: 디자인 확정 대기', isRead: false, createdAt: '2026-06-27T08:40:00Z' },
  { id: 703, recipientId: 1, type: 'MENTIONED', workItemId: 905, message: '댓글에서 언급되었습니다.', isRead: true, createdAt: '2026-06-26T17:20:00Z' },
];
let inboxNotis = seedInbox.map((n) => ({ ...n }));

export const handlers = [
  // ── A. 인증 ──
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(300);
    const { email, password } = (await request.json()) as { email: string; password: string };
    const u = users.find((x) => x.email === email);
    if (!u || u.password !== password) return fail(401, 'WMP-7701', '이메일 또는 비밀번호가 올바르지 않습니다.');
    if (!u.active) return fail(403, 'WMP-7702', '비활성화된 계정입니다.');
    return ok({ accessToken: `mock.${u.id}`, refreshToken: `mock-refresh.${u.id}`, user: publicUser(u) });
  }),

  http.post(`${BASE}/auth/logout`, () => ok(null)),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const u = currentUser(request);
    if (!u) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    return ok(publicUser(u));
  }),

  // ── B. 사용자 (PageResponse) ──
  http.get(`${BASE}/users`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase();
    const list = users
      .filter((u) => u.active)
      .filter((u) => !keyword || u.name.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword))
      .map(publicUser);
    // bp-common-lib PageResponse: { items, totalCount, page, pageSize, totalPages }
    return ok({ items: list, totalCount: list.length, page: 0, pageSize: list.length || 20, totalPages: 1 });
  }),

  // ── C. 워크스페이스 (배열) ──
  http.get(`${BASE}/workspaces`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    return ok(seedWorkspaces);
  }),

  // ── D. 프로젝트 ──
  http.get(`${BASE}/projects`, ({ request }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const status = url.searchParams.get('status');
    const templateId = url.searchParams.get('templateId');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    const list = projects
      .filter((p) => includeArchived || p.status !== 'ARCHIVED')
      .filter((p) => visibleTo(p, me.id)) // BIZ-108
      .filter((p) => !workspaceId || p.workspaceId === Number(workspaceId))
      .filter((p) => !status || p.status === status)
      .filter((p) => !templateId || p.templateId === Number(templateId));
    return ok(list); // 배열
  }),

  http.post(`${BASE}/projects`, async ({ request }) => {
    await delay(250);
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    if (me.role === 'MEMBER' || me.role === 'VIEWER') return fail(403, 'WMP-7710', '프로젝트 생성 권한이 없습니다.');
    const body = (await request.json()) as {
      name: string; key: string; workspaceId: number; templateId: number;
      visibility?: 'PUBLIC' | 'PRIVATE'; startDate?: string; endDate?: string; description?: string;
    };
    if (!body.name?.trim()) return fail(400, 'WMP-7711', '프로젝트명을 입력하세요.');
    if (!/^[A-Z][A-Z0-9]{1,9}$/.test(body.key ?? '')) return fail(400, 'WMP-7712', '키 형식이 올바르지 않습니다.');
    if (projects.some((p) => p.key === body.key)) return fail(409, 'WMP-7713', `이미 사용 중인 키: ${body.key}`);

    const id = ++projectSeq;
    const p: Project = {
      id, key: body.key, workspaceId: body.workspaceId, name: body.name.trim(),
      templateId: body.templateId, status: 'PLANNING', visibility: body.visibility ?? 'PUBLIC',
      activeTabs: [], startDate: body.startDate, endDate: body.endDate, description: body.description,
      createdBy: me.id,
    };
    projects.push(p);
    members.push({ projectId: id, userId: me.id, role: 'MANAGER' }); // 생성자 자동 MANAGER
    return created(p);
  }),

  http.get(`${BASE}/projects/:id`, ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const p = projects.find((x) => x.id === Number(params.id));
    if (!p) return fail(404, 'WMP-7715', '프로젝트를 찾을 수 없습니다.');
    if (!visibleTo(p, me.id)) return fail(403, 'WMP-7719', '접근 권한이 없습니다.');
    return ok(p);
  }),

  http.get(`${BASE}/projects/:id/summary`, ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const p = projects.find((x) => x.id === Number(params.id));
    if (!p) return fail(404, 'WMP-7715', '프로젝트를 찾을 수 없습니다.');
    // work_item 집계는 Sprint3 이후. Sprint2는 0.
    return ok({ total: 0, done: 0, delayed: 0, blocked: 0, progress: 0 });
  }),

  http.patch(`${BASE}/projects/:id/visibility`, async ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const p = projects.find((x) => x.id === Number(params.id));
    if (!p) return fail(404, 'WMP-7715', '프로젝트를 찾을 수 없습니다.');
    const { visibility } = (await request.json()) as { visibility: 'PUBLIC' | 'PRIVATE' };
    p.visibility = visibility;
    return ok(p);
  }),

  // ── E. 멤버 ──
  http.get(`${BASE}/projects/:id/members`, ({ request, params }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const pid = Number(params.id);
    const list = members
      .filter((m) => m.projectId === pid)
      .map((m) => {
        const u = users.find((x) => x.id === m.userId);
        return u ? { userId: u.id, name: u.name, email: u.email, role: m.role } : null;
      })
      .filter(Boolean);
    return ok(list);
  }),

  http.post(`${BASE}/projects/:id/members`, async ({ request, params }) => {
    await delay(200);
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    if (me.role === 'MEMBER' || me.role === 'VIEWER') return fail(403, 'WMP-7716', '멤버 초대 권한이 없습니다.');
    const pid = Number(params.id);
    const { userId, role } = (await request.json()) as { userId: number; role?: UserRole };
    const u = users.find((x) => x.id === userId);
    if (!u) return fail(400, 'WMP-7717', '존재하지 않는 사용자입니다.');
    if (members.some((m) => m.projectId === pid && m.userId === userId)) return fail(409, 'WMP-7718', '이미 멤버입니다.');
    const r = role ?? 'MEMBER';
    members.push({ projectId: pid, userId, role: r });
    return created({ userId: u.id, name: u.name, email: u.email, role: r });
  }),

  http.delete(`${BASE}/projects/:id/members/:userId`, ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    if (me.role === 'MEMBER' || me.role === 'VIEWER') return fail(403, 'WMP-7716', '멤버 제거 권한이 없습니다.');
    const pid = Number(params.id);
    members = members.filter((m) => !(m.projectId === pid && m.userId === Number(params.userId)));
    return ok(null);
  }),

  // ── G. 회사홈/대시보드(§9.2, WMP-HOME-001~002) ──
  http.get(`${BASE}/dashboard/metrics`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    return ok({
      inProgress: dashItems.filter((w) => w.commonStatus === 'IN_PROGRESS').length,
      dueToday: dashItems.filter((w) => w.dueDate === '2026-06-27').length,
      dueThisWeek: dashItems.filter((w) => w.dueDate && w.dueDate >= '2026-06-22' && w.dueDate <= '2026-06-28').length,
      unassigned: pickDash('unassigned').length,
      stale: 0,
    });
  }),
  http.get(`${BASE}/dashboard/blocked`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    return ok(pageOf(pickDash('blocked'), Number(url.searchParams.get('page') ?? 0), Number(url.searchParams.get('size') ?? 20)));
  }),
  http.get(`${BASE}/dashboard/delayed`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    return ok(pageOf(pickDash('delayed'), Number(url.searchParams.get('page') ?? 0), Number(url.searchParams.get('size') ?? 20)));
  }),
  http.get(`${BASE}/dashboard/unassigned`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    return ok(pageOf(pickDash('unassigned'), Number(url.searchParams.get('page') ?? 0), Number(url.searchParams.get('size') ?? 20)));
  }),

  // 통합목록/검색(§9.5·§13.9, GET /work-items). dev 미러는 dashItems 기준 — keyword(제목·key·설명)·필터·페이징.
  http.get(`${BASE}/work-items`, ({ request }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    const kw = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const issueType = url.searchParams.get('issueType');
    const commonStatus = url.searchParams.get('commonStatus');
    const priority = url.searchParams.get('priority');
    const assigneeId = url.searchParams.get('assigneeId');
    const projectId = url.searchParams.get('projectId');
    let rows = dashItems.filter((w) => {
      if (kw && !(`${w.title} ${w.key}`.toLowerCase().includes(kw))) return false;
      if (issueType && w.issueType !== issueType) return false;
      if (commonStatus && w.commonStatus !== commonStatus) return false;
      if (priority && w.priority !== priority) return false;
      if (assigneeId && w.assigneeId !== Number(assigneeId)) return false;
      if (projectId && w.projectId !== Number(projectId)) return false;
      return true;
    });
    return ok(pageOf(rows, Number(url.searchParams.get('page') ?? 0), Number(url.searchParams.get('size') ?? 20)));
  }),

  // 업무 단건(받은함 알림 클릭 시 workItemId→key 해소). dev 미러는 dashItems 기준.
  http.get(`${BASE}/work-items/:id`, ({ request, params }) => {
    if (!currentUser(request)) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const wi = dashItems.find((w) => w.id === Number(params.id));
    if (!wi) return fail(404, 'WMP-7730', '업무를 찾을 수 없습니다.');
    return ok(wi);
  }),

  // ── H. 받은함/알림(§받은함, WMP-NOTI-001) ──
  http.get(`${BASE}/inbox`, ({ request }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const url = new URL(request.url);
    const isReadRaw = url.searchParams.get('isRead');
    let mine = inboxNotis.filter((n) => n.recipientId === me.id);
    if (isReadRaw != null) mine = mine.filter((n) => n.isRead === (isReadRaw === 'true'));
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);
    const unreadCount = inboxNotis.filter((n) => n.recipientId === me.id && !n.isRead).length;
    return ok({ notifications: pageOf(mine, page, size), unreadCount });
  }),
  http.patch(`${BASE}/notifications/:id/read`, ({ request, params }) => {
    const me = currentUser(request);
    if (!me) return fail(401, 'WMP-7700', '인증이 필요합니다.');
    const n = inboxNotis.find((x) => x.id === Number(params.id) && x.recipientId === me.id);
    if (!n) return fail(404, 'WMP-7731', '알림을 찾을 수 없습니다.');
    n.isRead = true;
    return ok(null);
  }),
];

export function __resetMockState() {
  users = [...seedUsers];
  projects = [...seedProjects];
  members = [...seedMembers];
  projectSeq = projects.length;
  inboxNotis = seedInbox.map((n) => ({ ...n }));
}
