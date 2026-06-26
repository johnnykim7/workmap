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
];

export function __resetMockState() {
  users = [...seedUsers];
  projects = [...seedProjects];
  members = [...seedMembers];
  projectSeq = projects.length;
}
