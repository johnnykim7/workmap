// 보드 API (T3-2 §G) — 실 BE 계약 기준.
// GET /projects/{id}/board (워크플로 상태별 컬럼+카드). 상태 전이: PATCH /work-items/{id}/status.
import { api } from '@/lib/api-client';
import type { WorkItemResponse, WorkStatus } from '@/types/domain';

// BE BoardDtos.Column — 워크플로 상태 1개 = 컬럼 1개(sort_order 순).
export interface BoardColumn {
  statusId: number;
  code: string;
  label: string;
  commonStatus: WorkStatus;
  isDone: boolean;
  isApproval: boolean;
  cards: WorkItemResponse[];
}

// BE BoardDtos.SprintGroup — ACTIVE 스프린트 1개 = 아코디언 섹션 1개(CR-039).
export interface BoardGroup {
  sprintId: number | null; // null = 운영형/스크럼 미시작(스프린트 없는 단일 섹션)
  sprintName: string | null;
  startDate: string | null;
  endDate: string | null;
  columns: BoardColumn[];
}

// BE BoardDtos.BoardResponse — ACTIVE 스프린트별 그룹 배열(CR-039, 병렬 스프린트).
export interface BoardResponse {
  projectId: number;
  workflowId: number | null;
  groups: BoardGroup[];
}

export const boardApi = {
  board: (projectId: number) => api.get<BoardResponse>(`/projects/${projectId}/board`),
  // 상태 전이(WMP-WI-007). FSM 가드 경유(BIZ-010). BLOCKED 전이 시 blockReason 필수(BIZ-005).
  changeStatus: (workItemId: number, toStatusId: number, blockReason?: string) =>
    api.patch<WorkItemResponse>(`/work-items/${workItemId}/status`, { toStatusId, blockReason }),
};
