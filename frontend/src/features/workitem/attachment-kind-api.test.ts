// 첨부 kind 구분 API 계약 테스트 (CR-051, WMP-WI-012, BIZ-118).
// fetch 스텁으로 kind 쿼리스트링(GET)·body.kind(POST)가 BE 계약과 일치하는지 검증.
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
    return ok([]);
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clear();
});

describe('workItemApi 첨부 kind — 계약', () => {
  it('GET kind 미지정=쿼리스트링 없음(전체·하위호환)', async () => {
    await workItemApi.listAttachments(42);
    expect(captured[0].url).toContain('/work-items/42/attachments');
    expect(captured[0].url).not.toContain('kind=');
  });

  it('GET kind=RESULT → ?kind=RESULT', async () => {
    await workItemApi.listAttachments(42, 'RESULT');
    expect(captured[0].url).toContain('/work-items/42/attachments?kind=RESULT');
  });

  it('GET kind=REFERENCE → ?kind=REFERENCE', async () => {
    await workItemApi.listAttachments(42, 'REFERENCE');
    expect(captured[0].url).toContain('?kind=REFERENCE');
  });

  it('POST body에 kind 실림', async () => {
    await workItemApi.createAttachment(42, {
      fileName: 'a.png', filePath: '/api/v1/files/serve/a.png', kind: 'RESULT',
    });
    expect(captured[0].method).toBe('POST');
    expect(captured[0].url).toContain('/work-items/42/attachments');
    expect((captured[0].body as { kind: string }).kind).toBe('RESULT');
  });
});
