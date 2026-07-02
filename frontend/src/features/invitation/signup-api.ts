// 가입 요청 관리 API (WMP-AUTH-010, CR-032) — Admin 전용. 신청(공개)은 features/auth.
import { api } from '@/lib/api-client';

export interface SignupRequestResponse {
  id: number;
  email: string;
  name: string;
  reason: string | null;
  status: string;
  createdAt: string;
}

export const signupRequestApi = {
  list: (status?: string) =>
    api.get<SignupRequestResponse[]>(`/signup-requests${status ? `?status=${status}` : ''}`),
  approve: (id: number, role: string) =>
    api.post<Record<string, never>>(`/signup-requests/${id}/approve`, { role }),
  reject: (id: number, reason?: string) =>
    api.post<Record<string, never>>(`/signup-requests/${id}/reject`, { reason: reason ?? null }),
};
