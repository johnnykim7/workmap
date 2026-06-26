// 애자일(스프린트/백로그) API (T3-2 §G) — 실 BE 계약 기준.
// 백로그: GET /projects/{id}/backlog. 스프린트: GET·POST /projects/{id}/sprints,
// POST /sprints/{id}/start·complete. 항목 스프린트 이동: PATCH /work-items/{id}/sprint.
import { api } from '@/lib/api-client';
import type { Sprint, WorkItemResponse } from '@/types/domain';

// BE SprintDtos.BacklogSection — 스프린트 1구역(또는 백로그). sprint=null이면 백로그.
export interface BacklogSection {
  sprint: Sprint | null;
  items: WorkItemResponse[];
  itemCount: number;
  storyPointsSum: number;
}

// BE SprintDtos.BacklogResponse — 스프린트들 + 백로그 영역.
export interface BacklogResponse {
  projectId: number;
  sprints: BacklogSection[];
  backlog: BacklogSection;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface CompleteResult {
  sprintId: number;
  doneCount: number;
  carriedOverCount: number;
  carriedToSprintId: number | null;
}

export const agileApi = {
  backlog: (projectId: number) => api.get<BacklogResponse>(`/projects/${projectId}/backlog`),
  listSprints: (projectId: number) => api.get<Sprint[]>(`/projects/${projectId}/sprints`),
  createSprint: (projectId: number, body: CreateSprintRequest) =>
    api.post<Sprint>(`/projects/${projectId}/sprints`, body),
  startSprint: (sprintId: number, body?: { startDate?: string; endDate?: string }) =>
    api.post<Sprint>(`/sprints/${sprintId}/start`, body),
  completeSprint: (sprintId: number, body?: { carryToSprintId?: number }) =>
    api.post<CompleteResult>(`/sprints/${sprintId}/complete`, body),
  // 항목 스프린트 담기/빼기(WMP-AGL-002). sprintId=null이면 백로그로.
  changeItemSprint: (workItemId: number, sprintId: number | null) =>
    api.patch<WorkItemResponse>(`/work-items/${workItemId}/sprint`, { sprintId }),
};
