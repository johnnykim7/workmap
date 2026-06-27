// 워크스페이스 API (T3-2 §C). 목록은 List<Response>(배열).
// 생성/수정은 Admin/Owner 전용(POL-004) — BE @PreAuthorize. 비권한은 403.
// 프로젝트 템플릿은 BE 조회 엔드포인트가 없어 domain.ts 상수(PROJECT_TEMPLATES)를 사용한다.
import { api } from '@/lib/api-client';
import type { Workspace } from '@/types/domain';

// BE WorkspaceDtos.CreateRequest/UpdateRequest: { name(필수, ≤150), description? }
export interface WorkspaceRequest {
  name: string;
  description?: string;
}

// BE WorkspaceDtos.MemberResponse (GET /workspaces/{id}/members, WMP-WS-007, CR-018)
export interface WorkspaceMember {
  userId: number;
  name: string;
  email: string;
  createdAt: string;
}

export const workspaceApi = {
  // 내가 속한 WS만(BIZ-112). WMP-WS-008 선택 가능 목록.
  list: () => api.get<Workspace[]>('/workspaces'),
  detail: (id: number) => api.get<Workspace>(`/workspaces/${id}`),
  create: (body: WorkspaceRequest) => api.post<Workspace>('/workspaces', body),
  update: (id: number, body: WorkspaceRequest) =>
    api.patch<Workspace>(`/workspaces/${id}`, body),

  // ── WS 멤버 관리 (WMP-WS-007) — 전사 Admin만(BE @PreAuthorize) ──
  members: (id: number) => api.get<WorkspaceMember[]>(`/workspaces/${id}/members`),
  addMember: (id: number, userId: number) =>
    api.post<void>(`/workspaces/${id}/members`, { userId }),
  removeMember: (id: number, userId: number) =>
    api.delete<void>(`/workspaces/${id}/members/${userId}`),
};
