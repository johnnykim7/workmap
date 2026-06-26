// 회사홈/대시보드 API (T3-2 §G, WMP-HOME-001~003) — 실 BE 계약 기준.
// 막힘/지연/미배정 목록·지표는 전사(가시성 BIZ-108 필터) 기준, ?projectId=로 프로젝트 축소 가능.
import { api, type PageResponse } from '@/lib/api-client';
import type { WorkItemResponse } from '@/types/domain';

// BE DashboardDtos.Metrics — 지표 카드(WMP-HOME-001).
export interface DashboardMetrics {
  inProgress: number;
  dueToday: number;
  dueThisWeek: number;
  unassigned: number;
  stale: number;
}

// 막힘/지연/미배정 목록 종류.
export type DashboardListKind = 'blocked' | 'delayed' | 'unassigned';

function qs(projectId?: number, page = 0, size = 20) {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (projectId != null) p.set('projectId', String(projectId));
  return p.toString();
}

export const dashboardApi = {
  // 지표 카드(WMP-HOME-001). projectId 미지정 = 전사.
  metrics: (projectId?: number) =>
    api.get<DashboardMetrics>(`/dashboard/metrics${projectId != null ? `?projectId=${projectId}` : ''}`),
  // 막힘/지연/미배정 목록(PageResponse<WorkItemResponse>).
  list: (kind: DashboardListKind, projectId?: number, page = 0, size = 20) =>
    api.get<PageResponse<WorkItemResponse>>(`/dashboard/${kind}?${qs(projectId, page, size)}`),
};
