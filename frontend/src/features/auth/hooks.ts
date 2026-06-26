// 인증 훅 — 로그인 mutation(성공 시 Zustand 세션 저장) · 로그아웃.
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from '@therecommerce/ds-ui';
import { authApi, type LoginRequest } from './api';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/lib/route-paths';
import { ApiError } from '@/lib/api-client';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (res) => {
      setSession({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
      navigate(ROUTES.home, { replace: true });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : '로그인에 실패했습니다.';
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    // 서버 실패해도 클라이언트 세션은 비운다(로컬 로그아웃 보장).
    onSettled: () => {
      clear();
      navigate(ROUTES.login, { replace: true });
    },
  });
}
