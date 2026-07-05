// 워크스페이스 API 계약(경로·메서드) 테스트 — CR-046 WS 보관/해제 + 기존 CRUD.
// fetch 스텁으로 요청 URL/메서드가 BE WorkspaceController 계약과 일치하는지 검증.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { workspaceApi } from './api';
import { useAuthStore } from '@/store/auth-store';

interface Captured { url: string; method: string; body: unknown; }
let captured: Captured[];

function ok<T>(data: T) {
  return { ok: true, status: 200, json: async () => ({ success: true, data, error: null }) } as Response;
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
    return ok({});
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clear();
});

const last = () => captured[captured.length - 1];

describe('워크스페이스 보관 API 계약 (CR-046, WMP-WS-011)', () => {
  it('보관_PATCH_/workspaces/{id}/archive', async () => {
    await workspaceApi.archive(5);
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/workspaces\/5\/archive$/);
  });

  it('보관해제_PATCH_/workspaces/{id}/unarchive', async () => {
    await workspaceApi.unarchive(5);
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/workspaces\/5\/unarchive$/);
  });
});

describe('워크스페이스 기존 CRUD 계약', () => {
  it('수정_PATCH_/workspaces/{id}', async () => {
    await workspaceApi.update(5, { name: '새 이름', description: '설명' });
    expect(last().method).toBe('PATCH');
    expect(last().url).toMatch(/\/workspaces\/5$/);
    expect(last().body).toMatchObject({ name: '새 이름' });
  });

  it('멤버추가_POST_/workspaces/{id}/members', async () => {
    await workspaceApi.addMember(5, 42);
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/workspaces\/5\/members$/);
    expect(last().body).toMatchObject({ userId: 42 });
  });
});
