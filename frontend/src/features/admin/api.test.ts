// 관리자 마스터 API 계약(경로·메서드·바디) 단위 테스트 (T3-2 §H, WMP-ADM-001~003).
// MSW 대신 fetch를 스텁해 요청 URL/메서드/바디가 BE AdminController 계약과 일치하는지 검증.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi } from './api';
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
    return ok({ items: [], totalCount: 0, page: 0, pageSize: 20, totalPages: 0 });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clear();
});

const last = () => captured[captured.length - 1];

describe('관리자 마스터 API 계약 (T3-2 §H)', () => {
  it('측정단위_목록_GET_경로·페이징쿼리', async () => {
    await adminApi.measureUnits.list(2, 50);
    expect(last().method).toBe('GET');
    expect(last().url).toContain('/admin/measure-units?');
    expect(last().url).toContain('page=2');
    expect(last().url).toContain('size=50');
  });

  it('측정단위_생성_POST_바디전달', async () => {
    await adminApi.measureUnits.create({ name: '진척률', valueType: 'NUMBER', suffix: '%' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/admin\/measure-units$/);
    expect(last().body).toMatchObject({ name: '진척률', valueType: 'NUMBER', suffix: '%' });
  });

  it('측정단위_수정·삭제_PUT/DELETE_id경로', async () => {
    await adminApi.measureUnits.update(7, { name: 'x', valueType: 'BOOLEAN' });
    expect(last().method).toBe('PUT');
    expect(last().url).toMatch(/\/admin\/measure-units\/7$/);

    await adminApi.measureUnits.remove(7);
    expect(last().method).toBe('DELETE');
    expect(last().url).toMatch(/\/admin\/measure-units\/7$/);
  });

  it('필드스킴_목록_projectId·issueTypeCode쿼리', async () => {
    await adminApi.fieldSchemes.list({ projectId: 3, issueTypeCode: 'BUG', page: 0 });
    expect(last().url).toContain('/admin/field-schemes?');
    expect(last().url).toContain('projectId=3');
    expect(last().url).toContain('issueTypeCode=BUG');
  });

  it('필드스킴_목록_전역(projectId 미지정)_쿼리에 projectId 없음', async () => {
    await adminApi.fieldSchemes.list({ issueTypeCode: 'TASK' });
    expect(last().url).not.toContain('projectId=');
    expect(last().url).toContain('issueTypeCode=TASK');
  });

  it('워크플로_상태추가_POST_중첩경로', async () => {
    await adminApi.workflows.addStatus(5, {
      code: 'IN_REVIEW', label: '검토중', commonStatus: 'IN_REVIEW',
    });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/admin\/workflows\/5\/statuses$/);
    expect(last().body).toMatchObject({ code: 'IN_REVIEW', commonStatus: 'IN_REVIEW' });
  });

  it('워크플로_전이추가_POST_from/to바디', async () => {
    await adminApi.workflows.addTransition(5, { fromStatusId: 10, toStatusId: 20 });
    expect(last().url).toMatch(/\/admin\/workflows\/5\/transitions$/);
    expect(last().body).toMatchObject({ fromStatusId: 10, toStatusId: 20 });
  });

  it('워크플로_전이삭제_DELETE_transitionId경로', async () => {
    await adminApi.workflows.removeTransition(5, 99);
    expect(last().method).toBe('DELETE');
    expect(last().url).toMatch(/\/admin\/workflows\/5\/transitions\/99$/);
  });

  it('인증토큰_Authorization헤더로_전달', async () => {
    await adminApi.workflows.list();
    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
    const headers = (call[1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token');
  });
});
