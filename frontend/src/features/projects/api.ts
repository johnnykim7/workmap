// 프로젝트 API (T3-2 §D) — 실 BE 계약 기준.
// 목록은 List<Response>(배열). 경로 파라미터는 numeric id. keyword는 BE 미지원 → 클라 필터.
import { api } from '@/lib/api-client';
import type { Project, ProjectStatus, ProjectSummary, Visibility } from '@/types/domain';

export interface ProjectFilter {
  workspaceId?: number;
  status?: ProjectStatus;
  templateId?: number; // 유형 필터(BE는 type이 아닌 templateId)
  keyword?: string; // BE 미지원 — 클라이언트 측 필터
}

// BE ProjectDtos.CreateRequest: workspaceId, key, name, templateId, visibility?, startDate?, endDate?, description?
export interface CreateProjectRequest {
  workspaceId: number;
  key: string;
  name: string;
  templateId: number;
  visibility?: Visibility;
  startDate?: string;
  endDate?: string;
  description?: string;
}

// BE ProjectDtos.UpdateRequest (PATCH /projects/{id}, WMP-WS-004): null/미전달 필드는 미변경.
// 가시성/상태는 전용 엔드포인트로 분리(여기엔 없음).
export interface UpdateProjectRequest {
  name?: string;
  activeTabs?: string[];
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

function toQuery(f: ProjectFilter): string {
  const sp = new URLSearchParams();
  if (f.workspaceId) sp.set('workspaceId', String(f.workspaceId));
  if (f.status) sp.set('status', f.status);
  if (f.templateId) sp.set('templateId', String(f.templateId));
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const projectApi = {
  list: (filter: ProjectFilter) => api.get<Project[]>(`/projects${toQuery(filter)}`),
  detail: (id: number) => api.get<Project>(`/projects/${id}`),
  summary: (id: number) => api.get<ProjectSummary>(`/projects/${id}/summary`),
  create: (body: CreateProjectRequest) => api.post<Project>('/projects', body),
  // 수정(WMP-WS-004) — PATCH /projects/{id}. Manager 이상.
  update: (id: number, body: UpdateProjectRequest) =>
    api.patch<Project>(`/projects/${id}`, body),
  // 보관(WMP-WS-004) — PATCH /projects/{id}/archive(소프트, FSM 가드). body 없음.
  archive: (id: number) => api.patch<Project>(`/projects/${id}/archive`, {}),
  // 가시성 변경(WMP-WS-006) — PATCH /projects/{id}/visibility. PUBLIC/PRIVATE.
  changeVisibility: (id: number, visibility: Visibility) =>
    api.patch<Project>(`/projects/${id}/visibility`, { visibility }),
};
