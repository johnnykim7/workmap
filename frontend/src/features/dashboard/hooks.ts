// 회사홈/대시보드 훅 — 지표 + 막힘/지연/미배정 목록(react-query).
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardListKind } from './api';

export const dashboardKeys = {
  metrics: (projectId?: number) => ['dashboard', 'metrics', projectId ?? 'all'] as const,
  list: (kind: DashboardListKind, projectId?: number) =>
    ['dashboard', kind, projectId ?? 'all'] as const,
};

export function useDashboardMetrics(projectId?: number) {
  return useQuery({
    queryKey: dashboardKeys.metrics(projectId),
    queryFn: () => dashboardApi.metrics(projectId),
  });
}

// 회사홈 패널은 상위 N건만 미리보기로 노출(전체는 /search 도착지에서, §9.2).
export function useDashboardList(kind: DashboardListKind, size = 5, projectId?: number) {
  return useQuery({
    queryKey: [...dashboardKeys.list(kind, projectId), size] as const,
    queryFn: () => dashboardApi.list(kind, projectId, 0, size),
  });
}
