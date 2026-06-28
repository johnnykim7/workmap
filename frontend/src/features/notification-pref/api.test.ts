// 알림 수신 설정 + FCM 토큰 API 계약(경로·메서드·바디) 단위 테스트 (T3-2 §L, WMP-NOTI-003·004, CR-028).
// MSW 대신 fetch를 스텁해 요청 URL/메서드/바디가 BE 계약과 일치하는지 검증(node 환경).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationPrefApi } from './api';
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
    user: { id: 1, name: 'u', email: 'a@b.com', role: 'MEMBER' } as any,
    accessToken: 'test-token',
    refreshToken: 'r',
  });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return ok({ items: [] });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().clear();
});

const last = () => captured[captured.length - 1];

describe('알림 수신 설정 API 계약 (T3-2 §L)', () => {
  it('수신설정_목록_GET_경로', async () => {
    await notificationPrefApi.list();
    expect(last().method).toBe('GET');
    expect(last().url).toMatch(/\/notification-preferences$/);
  });

  it('수신설정_부분upsert_PUT_items바디', async () => {
    await notificationPrefApi.update([
      { type: 'ASSIGNED', inApp: true, email: true, push: false },
    ]);
    expect(last().method).toBe('PUT');
    expect(last().url).toMatch(/\/notification-preferences$/);
    expect(last().body).toMatchObject({
      items: [{ type: 'ASSIGNED', inApp: true, email: true, push: false }],
    });
  });

  it('FCM토큰_등록_POST_바디', async () => {
    await notificationPrefApi.registerFcmToken('tok-123', 'Web');
    expect(last().method).toBe('POST');
    expect(last().url).toMatch(/\/fcm\/token$/);
    expect(last().body).toMatchObject({ fcmToken: 'tok-123', deviceInfo: 'Web' });
  });

  it('FCM토큰_삭제_DELETE_바디', async () => {
    await notificationPrefApi.deleteFcmToken('tok-123');
    expect(last().method).toBe('DELETE');
    expect(last().url).toMatch(/\/fcm\/token$/);
    expect(last().body).toMatchObject({ fcmToken: 'tok-123' });
  });
});
