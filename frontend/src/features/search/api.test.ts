// 전사 검색 FE-BE 계약 테스트 (§13.9, WMP-VIEW-001).
// MSW 핸들러가 실 BE 계약 대역. projectId 없이 전사 검색·keyword·필터·페이징 형태 검증.
import { beforeEach, describe, expect, it } from 'vitest';
import { authApi } from '@/features/auth/api';
import { searchApi } from './api';
import { useAuthStore } from '@/store/auth-store';

async function loginAs(email: string, password: string) {
  const res = await authApi.login({ email, password });
  useAuthStore.getState().setSession({
    user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken,
  });
}

describe('전사 검색 계약 (§13.9)', () => {
  beforeEach(async () => {
    useAuthStore.getState().clear();
    await loginAs('admin@therecommerce.com', 'admin1234');
  });

  it('projectId없이_전사검색_PageResponse', async () => {
    const page = await searchApi.search({});
    expect(page).toHaveProperty('items');
    expect(page).toHaveProperty('totalCount');
    expect(page).toHaveProperty('totalPages');
    expect(page.items.length).toBeGreaterThan(0);
  });

  it('keyword_제목매칭', async () => {
    const page = await searchApi.search({ keyword: '결제' });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((w) => w.title.includes('결제') || w.key.includes('결제'))).toBe(true);
  });

  it('상태필터_BLOCKED만', async () => {
    const page = await searchApi.search({ commonStatus: 'BLOCKED' });
    expect(page.items.every((w) => w.commonStatus === 'BLOCKED')).toBe(true);
  });

  it('유형필터_BUG만', async () => {
    const page = await searchApi.search({ issueType: 'BUG' });
    expect(page.items.every((w) => w.issueType === 'BUG')).toBe(true);
  });

  it('미인증_401거부', async () => {
    useAuthStore.getState().clear();
    await expect(searchApi.search({})).rejects.toMatchObject({ status: 401 });
  });
});
