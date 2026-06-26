// 프로젝트 멤버 API (T3-2 §E) + 사용자 검색(§B). 실 BE 계약 기준.
// 경로는 numeric projectId. 멤버 응답은 { userId, name, email, role, createdAt }.
import { api } from '@/lib/api-client';
import type { ProjectMember, User, UserRole } from '@/types/domain';
import type { PageResponse } from '@/lib/api-client';

export interface InviteMemberRequest {
  userId: number;
  role: UserRole;
}

export const memberApi = {
  list: (projectId: number) => api.get<ProjectMember[]>(`/projects/${projectId}/members`),
  invite: (projectId: number, body: InviteMemberRequest) =>
    api.post<ProjectMember>(`/projects/${projectId}/members`, body),
  remove: (projectId: number, userId: number) =>
    api.delete<void>(`/projects/${projectId}/members/${userId}`),
  // 초대 후보 사용자 검색(§B GET /users → PageResponse<User>)
  searchUsers: (keyword: string) => {
    const sp = new URLSearchParams();
    if (keyword.trim()) sp.set('keyword', keyword.trim());
    const q = sp.toString();
    return api.get<PageResponse<User>>(`/users${q ? `?${q}` : ''}`);
  },
};
