// 회사홈/대시보드 FE-BE 계약 테스트 (T3-2 §G, WMP-HOME-001~002).
// MSW 핸들러가 실 BE 계약 대역. 경로·필드·페이지 형태가 BE와 일치하는지 검증.
import { beforeEach, describe, expect, it } from 'vitest';
import { authApi } from '@/features/auth/api';
import { dashboardApi } from './api';
import { useAuthStore } from '@/store/auth-store';

async function loginAs(email: string, password: string) {
  const res = await authApi.login({ email, password });
  useAuthStore.getState().setSession({
    user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken,
  });
}

describe('회사홈 대시보드 계약 (T3-2 §G)', () => {
  beforeEach(async () => {
    useAuthStore.getState().clear();
    await loginAs('admin@therecommerce.com', 'admin1234');
  });

  it('지표_5개필드_숫자반환', async () => {
    const m = await dashboardApi.metrics();
    expect(m).toHaveProperty('inProgress');
    expect(m).toHaveProperty('dueToday');
    expect(m).toHaveProperty('dueThisWeek');
    expect(m).toHaveProperty('unassigned');
    expect(m).toHaveProperty('stale');
    expect(typeof m.inProgress).toBe('number');
  });

  it('막힘목록_PageResponse형태_blockReason포함', async () => {
    const page = await dashboardApi.list('blocked', undefined, 0, 5);
    expect(page).toHaveProperty('items');
    expect(page).toHaveProperty('totalCount');
    expect(page).toHaveProperty('totalPages');
    expect(page.items.length).toBeGreaterThan(0);
    // 막힘 목록은 BLOCKED 또는 blockReason 보유.
    expect(page.items.every((w) => w.commonStatus === 'BLOCKED' || !!w.blockReason)).toBe(true);
  });

  it('미배정목록_담당자없음만', async () => {
    const page = await dashboardApi.list('unassigned');
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((w) => w.assigneeId == null)).toBe(true);
  });

  it('지연목록_기한초과미완료', async () => {
    const page = await dashboardApi.list('delayed');
    expect(page.items.every((w) => w.commonStatus !== 'DONE')).toBe(true);
  });

  it('미인증_401거부', async () => {
    useAuthStore.getState().clear();
    await expect(dashboardApi.metrics()).rejects.toMatchObject({ status: 401 });
  });
});
