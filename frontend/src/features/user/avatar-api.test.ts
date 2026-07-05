// CR-047 사용자 상세·아바타 API 계약 테스트 — 경로·메서드·바디가 BE UserController와 일치하는지.
// MSW 대신 fetch 스텁(DOM 무의존, node 환경).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userApi } from './api';
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
    return ok({});
  }));
});
afterEach(() => { vi.unstubAllGlobals(); useAuthStore.getState().clear(); });

const last = () => captured[captured.length - 1];

describe('CR-047 사용자 아바타 API 계약', () => {
  it('프로필상세_GET_users_id', async () => {
    await userApi.getDetail(9);
    expect(last().method).toBe('GET');
    expect(last().url).toContain('/users/9');
  });

  it('본인아바타저장_PATCH_users_me_avatar_바디avatarUrl', async () => {
    await userApi.updateMyAvatar('/files/serve/x.png');
    expect(last().method).toBe('PATCH');
    expect(last().url).toContain('/users/me/avatar');
    expect(last().body).toEqual({ avatarUrl: '/files/serve/x.png' });
  });

  it('아바타제거_PATCH_바디null', async () => {
    await userApi.updateMyAvatar(null);
    expect(last().method).toBe('PATCH');
    expect(last().url).toContain('/users/me/avatar');
    expect(last().body).toEqual({ avatarUrl: null });
  });
});
