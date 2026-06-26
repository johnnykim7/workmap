import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/domain';

// 인증 전역 상태 (Zustand). JWT access/refresh + 현재 유저.
// Sprint2 로그인 API 연동 시 setSession 호출. Sprint1은 골격만.
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (p: { user: User; accessToken: string; refreshToken: string }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      clear: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'workmap-auth' },
  ),
);
