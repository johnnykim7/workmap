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

export const workspaceApi = {
  list: () => api.get<Workspace[]>('/workspaces'),
  create: (body: WorkspaceRequest) => api.post<Workspace>('/workspaces', body),
  update: (id: number, body: WorkspaceRequest) =>
    api.patch<Workspace>(`/workspaces/${id}`, body),
};
