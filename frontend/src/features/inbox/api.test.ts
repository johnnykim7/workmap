// 받은함/알림 FE-BE 계약 테스트 (T3-2 §I·L, WMP-NOTI-001).
// MSW 핸들러가 실 BE 계약 대역. /inbox 통합 응답(목록+배지)·읽음 처리·격리 검증.
import { beforeEach, describe, expect, it } from 'vitest';
import { authApi } from '@/features/auth/api';
import { inboxApi } from './api';
import { useAuthStore } from '@/store/auth-store';

async function loginAs(email: string, password: string) {
  const res = await authApi.login({ email, password });
  useAuthStore.getState().setSession({
    user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken,
  });
}

describe('받은함 계약 (T3-2 §L)', () => {
  beforeEach(async () => {
    useAuthStore.getState().clear();
    await loginAs('admin@therecommerce.com', 'admin1234'); // id=1, mock 알림 수신자
  });

  it('받은함_목록과배지_통합반환', async () => {
    const res = await inboxApi.inbox();
    expect(res).toHaveProperty('notifications');
    expect(res).toHaveProperty('unreadCount');
    expect(res.notifications).toHaveProperty('items');
    expect(res.notifications).toHaveProperty('totalCount');
    expect(res.notifications.items.length).toBeGreaterThan(0);
    expect(res.unreadCount).toBe(2); // seed: 안읽음 2
  });

  it('안읽음필터_isRead거짓만', async () => {
    const res = await inboxApi.inbox(false);
    expect(res.notifications.items.every((n) => !n.isRead)).toBe(true);
  });

  it('읽음처리_배지감소', async () => {
    const before = await inboxApi.inbox();
    const target = before.notifications.items.find((n) => !n.isRead)!;
    await inboxApi.markRead(target.id);
    const after = await inboxApi.inbox();
    expect(after.unreadCount).toBe(before.unreadCount - 1);
    expect(after.notifications.items.find((n) => n.id === target.id)?.isRead).toBe(true);
  });

  it('읽음후_안읽음필터에서제외', async () => {
    const unreadBefore = await inboxApi.inbox(false);
    const target = unreadBefore.notifications.items[0];
    await inboxApi.markRead(target.id);
    const unreadAfter = await inboxApi.inbox(false);
    expect(unreadAfter.notifications.items.some((n) => n.id === target.id)).toBe(false);
  });

  it('미인증_401거부', async () => {
    useAuthStore.getState().clear();
    await expect(inboxApi.inbox()).rejects.toMatchObject({ status: 401 });
  });
});
