// 인증 API (T3-2 §A) — POST /auth/login · POST /auth/logout · GET /auth/me.
import { api } from '@/lib/api-client';
import type { User } from '@/types/domain';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body),
  logout: () => api.post<Record<string, never>>('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
};
