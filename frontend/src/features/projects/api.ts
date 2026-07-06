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
  defaultTab?: string; // "기본값으로 설정"(CR-020). 진입 시 첫 화면.
  requireAcceptanceCriteria?: boolean; // 인수조건 완료 강제(CR-049). null이면 미변경.
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

// 탭 메뉴(Jira식, CR-020) — GET /tabs 응답.
export interface TabView {
  code: string;
  label: string; // 폴백 적용된 최종 표시명(project_tab_label → tab_def → code)
  isDefault: boolean;
  isCustom: boolean; // 프로젝트별 이름 오버라이드 존재(되돌리기 노출 판단)
}
export interface TabsResponse {
  tabs: TabView[];
  defaultTab: string | null;
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

  // 탭 메뉴(Jira식, CR-020)
  tabs: (id: number) => api.get<TabsResponse>(`/projects/${id}/tabs`),
  renameTab: (id: number, code: string, label: string) =>
    api.put<void>(`/projects/${id}/tabs/${code}/label`, { label }),
  resetTabLabel: (id: number, code: string) =>
    api.delete<void>(`/projects/${id}/tabs/${code}/label`),
};
