// AI 업무 초안 API 계약(경로·메서드·바디) 단위 테스트 (WMP-WI-019, CR-050).
// fetch 스텁으로 요청 URL/메서드/바디가 BE AiDraftController 계약과 일치하는지 검증(DOM 무의존).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiDraftApi } from './api';
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
    user: { id: 1, name: 'u', email: 'a@b.com', role: 'ADMIN' } as any,
    accessToken: 't', refreshToken: 'r',
  });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return ok({ created: [], failedCount: 0, count: 0 });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); useAuthStore.getState().clear(); });

const last = () => captured[captured.length - 1];

describe('AI 초안 API 계약 (CR-050)', () => {
  it('초안생성_epic모드_POST', async () => {
    await aiDraftApi.create(7, { statement: '결제 기능', mode: 'epic' });
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/projects\/7\/ai-drafts$/);
    expect(last().body).toMatchObject({ statement: '결제 기능', mode: 'epic' });
  });

  it('초안생성_storyTask모드_epicId바디', async () => {
    await aiDraftApi.create(7, { statement: '스토리 뽑기', mode: 'story_task', epicId: 100 });
    expect(last().body).toMatchObject({ mode: 'story_task', epicId: 100 });
  });

  it('초안목록_GET', async () => {
    await aiDraftApi.list(7);
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/projects\/7\/ai-drafts$/);
  });

  it('초안확정_지정ids_POST_confirm', async () => {
    await aiDraftApi.confirm(7, [101, 102]);
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/projects\/7\/ai-drafts\/confirm$/);
    expect(last().body).toMatchObject({ ids: [101, 102] });
  });

  it('초안확정_전체_빈배열', async () => {
    await aiDraftApi.confirm(7);
    expect(last().body).toMatchObject({ ids: [] });
  });

  it('초안전체버리기_DELETE', async () => {
    await aiDraftApi.discardAll(7);
    expect(last().method).toBe('DELETE');
    expect(last().url).toMatch(/\/projects\/7\/ai-drafts$/);
  });
});
