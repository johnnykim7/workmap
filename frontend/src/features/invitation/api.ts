// 사용자 초대 API (T3-2 §B, WMP-AUTH-004, CR-027) — Admin 전용.
// 초대 생성 시 user를 만들지 않고 인증번호 이메일을 발송한다. user는 수락 시점에 생성.
import { api } from '@/lib/api-client';

export interface InviteRequest {
  email: string;
  name: string;
  role?: string | null;
  departmentId?: number | null;
  workspaceId?: number | null; // CR-033 — 수락 시 이 WS로 자동 합류
}

export interface InvitationResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export const invitationApi = {
  invite: (body: InviteRequest) => api.post<InvitationResponse>('/invitations', body),
  list: (status?: string) =>
    api.get<InvitationResponse[]>(`/invitations${status ? `?status=${status}` : ''}`),
  resend: (id: number) => api.post<Record<string, never>>(`/invitations/${id}/resend`),
  revoke: (id: number) => api.delete<Record<string, never>>(`/invitations/${id}`),
};
