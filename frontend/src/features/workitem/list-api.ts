// 통합 목록(§9.5, T3-2 WMP-VIEW-001) + 벌크편집(WMP-WI-015) API — 실 BE 계약. 신규 BE 없음.
import { api, type PageResponse } from '@/lib/api-client';
import type { WorkItemResponse, IssueType, WorkStatus, Priority } from '@/types/domain';

// BE SearchParams 화이트리스트 정렬 키(WorkItemQueryService.SORT_COLUMNS).
export type WorkItemSortKey = 'createdAt' | 'dueDate' | 'priority' | 'statusChangedAt' | 'updatedAt';
export type SortDirection = 'ASC' | 'DESC';

export interface WorkItemListParams {
  projectId: number;
  issueType?: IssueType;
  commonStatus?: WorkStatus;
  priority?: Priority;
  assigneeId?: number;
  sprintId?: number;
  epicId?: number;
  keyword?: string;
  sort?: WorkItemSortKey;
  direction?: SortDirection;
  page?: number;
  size?: number;
}

// PATCH /work-items/bulk — 다건 일괄 변경. 보낸 액션만 적용. 항목별 FSM 검증·실패 분리.
export interface BulkRequest {
  ids: number[];
  toStatusId?: number;
  changeAssignee?: boolean;   // true면 assigneeId 적용(null=미배정)
  assigneeId?: number | null;
  changeSprint?: boolean;     // true면 sprintId 적용(null=백로그)
  sprintId?: number | null;
  priority?: Priority;
  labels?: string[];
}

export interface BulkFailure {
  id: number;
  reason: string;
}
export interface BulkResult {
  succeeded: number[];
  failed: BulkFailure[];
}

export function toQuery(p: WorkItemListParams): string {
  const sp = new URLSearchParams();
  sp.set('projectId', String(p.projectId));
  if (p.issueType) sp.set('issueType', p.issueType);
  if (p.commonStatus) sp.set('commonStatus', p.commonStatus);
  if (p.priority) sp.set('priority', p.priority);
  if (p.assigneeId != null) sp.set('assigneeId', String(p.assigneeId));
  if (p.sprintId != null) sp.set('sprintId', String(p.sprintId));
  if (p.epicId != null) sp.set('epicId', String(p.epicId));
  if (p.keyword?.trim()) sp.set('keyword', p.keyword.trim());
  if (p.sort) sp.set('sort', p.sort);
  if (p.direction) sp.set('direction', p.direction);
  sp.set('page', String(p.page ?? 0));
  sp.set('size', String(p.size ?? 20));
  return sp.toString();
}

export const workListApi = {
  search: (params: WorkItemListParams) =>
    api.get<PageResponse<WorkItemResponse>>(`/work-items?${toQuery(params)}`),
  bulk: (body: BulkRequest) => api.patch<BulkResult>(`/work-items/bulk`, body),
};
