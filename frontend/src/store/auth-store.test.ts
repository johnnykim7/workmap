// auth-store 단위테스트 — 세션 저장/해제 상태 전이.
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';
import type { User } from '@/types/domain';

const user: User = { id: 1, name: '김관리', email: 'admin@therecommerce.com', role: 'ADMIN', active: true };

describe('auth-store', () => {
  beforeEach(() => useAuthStore.getState().clear());

  it('초기상태_미인증_토큰없음', () => {
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
  });

  it('setSession_호출_인증됨_유저토큰저장', () => {
    useAuthStore.getState().setSession({ user, accessToken: 'a', refreshToken: 'r' });
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.accessToken).toBe('a');
    expect(s.refreshToken).toBe('r');
    expect(s.user?.email).toBe('admin@therecommerce.com');
  });

  it('clear_호출_세션비워짐', () => {
    useAuthStore.getState().setSession({ user, accessToken: 'a', refreshToken: 'r' });
    useAuthStore.getState().clear();
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
  });
});
