// FE 미연결 4종 API 계약 테스트 (WMP-WI-001 / WMP-WS-001 / WMP-WS-004 / WMP-WS-006).
// MSW 대신 fetch를 스텁해 요청 URL/메서드/바디가 BE 컨트롤러 계약과 일치하는지 검증.
// (admin/api.test.ts와 동일 패턴 — DOM 무의존, node 환경에서 통과)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectApi } from './api';
import { workspaceApi } from '@/features/workspaces/api';
import { workItemApi } from '@/features/workitem/api';
import { useAuthStore } from '@/store/auth-store';

interface Captured {
  url: string;
  method: string;
  body: unknown;
}

let captured: Captured[];

function ok<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data, error: null }),
  } as Response;
}

beforeEach(() => {
  captured = [];
  useAuthStore.getState().setSession({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: { id: 1, name: 'admin', email: 'a@b.com', role: 'ADMIN' } as any,
    accessToken: 'test-token',
    refreshToken: 'r',
  });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return ok({ id: 1, key: 'TST-1', projectId: 1, issueType: 'TASK', visibility: 'PUBLIC' });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clear();
});

const last = () => captured[captured.length - 1];

describe('WMP-WI-001 업무 생성 — POST /work-items', () => {
  it('필수필드(projectId·issueType·title) 바디 전달', async () => {
    await workItemApi.create({ projectId: 7, issueType: 'STORY', title: '로그인 개선' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/work-items$/);
    expect(last().body).toMatchObject({ projectId: 7, issueType: 'STORY', title: '로그인 개선' });
  });

  it('선택필드(담당자·우선순위·라벨·Epic) 함께 전달', async () => {
    await workItemApi.create({
      projectId: 7, issueType: 'BUG', title: '장애',
      assigneeId: 3, priority: 'HIGH', epicId: 12, labels: ['긴급', '인프라'],
    });
    expect(last().body).toMatchObject({
      assigneeId: 3, priority: 'HIGH', epicId: 12, labels: ['긴급', '인프라'],
    });
  });
});

describe('WMP-WS-001 워크스페이스 생성/수정 — POST·PATCH /workspaces', () => {
  it('생성_POST_name·description 바디', async () => {
    await workspaceApi.create({ name: '물류 플랫폼', description: 'WMS/OMS' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/workspaces$/);
    expect(last().body).toMatchObject({ name: '물류 플랫폼', description: 'WMS/OMS' });
  });

  it('수정_PATCH_id경로·바디', async () => {
    await workspaceApi.update(5, { name: '변경됨' });
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/workspaces\/5$/);
    expect(last().body).toMatchObject({ name: '변경됨' });
  });
});

describe('WMP-WS-004 프로젝트 수정/보관 — PATCH /projects/{id}·/archive', () => {
  it('수정_PATCH_id경로·부분필드', async () => {
    await projectApi.update(9, { name: '리뉴얼', activeTabs: ['summary', 'board'] });
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/projects\/9$/);
    expect(last().body).toMatchObject({ name: '리뉴얼', activeTabs: ['summary', 'board'] });
  });

  it('보관_PATCH_archive경로_빈바디', async () => {
    await projectApi.archive(9);
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/projects\/9\/archive$/);
  });
});

describe('WMP-WS-006 가시성 변경 — PATCH /projects/{id}/visibility', () => {
  it('PRIVATE로 변경_visibility 바디', async () => {
    await projectApi.changeVisibility(9, 'PRIVATE');
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/projects\/9\/visibility$/);
    expect(last().body).toMatchObject({ visibility: 'PRIVATE' });
  });

  it('PUBLIC로 변경_visibility 바디', async () => {
    await projectApi.changeVisibility(9, 'PUBLIC');
    expect(last().body).toMatchObject({ visibility: 'PUBLIC' });
  });
});
