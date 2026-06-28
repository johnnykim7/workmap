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

// CR-027 — 초대 수락 / 비밀번호 재설정·변경 (인증번호 OTP)
export interface AcceptInvitationRequest {
  email: string;
  code: string;
  password: string;
}
export interface ForgotPasswordRequest {
  email: string;
}
export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}
export interface ChangePasswordRequest {
  currentPassword: string;
  code: string;
  newPassword: string;
}

export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body),
  logout: () => api.post<Record<string, never>>('/auth/logout'),
  me: () => api.get<User>('/auth/me'),

  // CR-027
  acceptInvitation: (body: AcceptInvitationRequest) =>
    api.post<LoginResponse>('/auth/invitations/accept', body),
  forgotPassword: (body: ForgotPasswordRequest) =>
    api.post<Record<string, never>>('/auth/password/forgot', body),
  resetPassword: (body: ResetPasswordRequest) =>
    api.post<Record<string, never>>('/auth/password/reset', body),
  requestChangeOtp: () =>
    api.post<Record<string, never>>('/auth/password/change/request-otp'),
  changePassword: (body: ChangePasswordRequest) =>
    api.post<Record<string, never>>('/auth/password/change', body),
};
