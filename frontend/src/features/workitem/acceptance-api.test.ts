// 인수조건 API 계약(경로·메서드·바디) 단위 테스트 (CR-049, WMP-WI-018).
// fetch 스텁으로 요청 URL/메서드/바디가 BE WorkItemController 계약과 일치하는지 검증.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { workItemApi } from './api';
import { useAuthStore } from '@/store/auth-store';

interface Captured { url: string; method: string; body: unknown }
let captured: Captured[];

function ok<T>(data: T) {
  return { ok: true, status: 200, json: async () => ({ success: true, data, error: null }) } as Response;
}

beforeEach(() => {
  captured = [];
  useAuthStore.getState().setSession({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: { id: 1, name: 'u', email: 'u@b.com', role: 'MEMBER' } as any,
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

describe('workItemApi.saveAcceptanceCriteria — 계약', () => {
  it('PATCH /work-items/{id}/acceptance-criteria + {criteria:[{text,checked}]}', async () => {
    await workItemApi.saveAcceptanceCriteria(42, [
      { text: '토큰 발급', checked: true },
      { text: '만료 갱신', checked: false },
    ]);
    const req = captured[0];
    expect(req.method).toBe('PATCH');
    expect(req.url).toContain('/work-items/42/acceptance-criteria');
    expect(req.body).toEqual({
      criteria: [
        { text: '토큰 발급', checked: true },
        { text: '만료 갱신', checked: false },
      ],
    });
  });
});
