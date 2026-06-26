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

// BE BoardDtos.BoardResponse.
export interface BoardResponse {
  projectId: number;
  workflowId: number | null;
  sprintId: number | null; // 스크럼 보드면 ACTIVE 스프린트 id, 운영 칸반이면 null
  columns: BoardColumn[];
}

export const boardApi = {
  board: (projectId: number) => api.get<BoardResponse>(`/projects/${projectId}/board`),
  // 상태 전이(WMP-WI-007). FSM 가드 경유(BIZ-010). BLOCKED 전이 시 blockReason 필수(BIZ-005).
  changeStatus: (workItemId: number, toStatusId: number, blockReason?: string) =>
    api.patch<WorkItemResponse>(`/work-items/${workItemId}/status`, { toStatusId, blockReason }),
};
