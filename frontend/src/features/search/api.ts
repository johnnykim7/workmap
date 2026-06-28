// 전사 검색 API (§13.9, WMP-VIEW-001) — GET /work-items(projectId 없이 가시범위 전체).
// BE: projectId 미지정 시 visibleProjectIds(BIZ-108) 전체 검색. keyword는 제목·key·설명·댓글 ILIKE.
import { api, type PageResponse } from '@/lib/api-client';
import type { WorkItemResponse, IssueType, WorkStatus, Priority } from '@/types/domain';
import type { WorkItemSortKey, SortDirection } from '@/features/workitem/list-api';

// 전사 검색 파라미터 — list-api와 동일 화이트리스트지만 projectId optional.
export interface SearchParams {
  keyword?: string;
  workspaceId?: number; // CR-018: 선택 WS로 좁힘(없으면 내 WS 전체 — BIZ-112 격리는 항상)
  issueType?: IssueType;
  commonStatus?: WorkStatus;
  priority?: Priority;
  assigneeId?: number;
  label?: string; // 라벨 필터 — labels JSONB 배열 포함 매칭
  sort?: WorkItemSortKey;
  direction?: SortDirection;
  page?: number;
  size?: number;
}

function toQuery(p: SearchParams): string {
  const sp = new URLSearchParams();
  if (p.keyword?.trim()) sp.set('keyword', p.keyword.trim());
  if (p.workspaceId != null) sp.set('workspaceId', String(p.workspaceId));
  if (p.issueType) sp.set('issueType', p.issueType);
  if (p.commonStatus) sp.set('commonStatus', p.commonStatus);
  if (p.priority) sp.set('priority', p.priority);
  if (p.assigneeId != null) sp.set('assigneeId', String(p.assigneeId));
  if (p.label?.trim()) sp.set('label', p.label.trim());
  if (p.sort) sp.set('sort', p.sort);
  if (p.direction) sp.set('direction', p.direction);
  sp.set('page', String(p.page ?? 0));
  sp.set('size', String(p.size ?? 20));
  return sp.toString();
}

export const searchApi = {
  search: (params: SearchParams) =>
    api.get<PageResponse<WorkItemResponse>>(`/work-items?${toQuery(params)}`),
};
