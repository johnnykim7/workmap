// 회사홈/대시보드 훅 — 지표 + 막힘/지연/미배정 목록(react-query).
// 회사홈은 선택 WS 컨텍스트로 좁힘(CR-018) — 훅이 store에서 currentWorkspaceId를 읽어 자동 전달.
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardListKind } from './api';
import { useWorkspaceStore } from '@/store/workspace-store';

export const dashboardKeys = {
  metrics: (projectId?: number, wsId?: number | null) =>
    ['dashboard', 'metrics', projectId ?? 'all', wsId ?? 'allWs'] as const,
  list: (kind: DashboardListKind, projectId?: number, wsId?: number | null) =>
    ['dashboard', kind, projectId ?? 'all', wsId ?? 'allWs'] as const,
};

export function useDashboardMetrics(projectId?: number) {
  const wsId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery({
    queryKey: dashboardKeys.metrics(projectId, wsId),
    queryFn: () => dashboardApi.metrics(projectId, wsId ?? undefined),
  });
}

// 회사홈 패널은 상위 N건만 미리보기로 노출(전체는 /search 도착지에서, §9.2).
export function useDashboardList(kind: DashboardListKind, size = 5, projectId?: number) {
  const wsId = useWorkspaceStore((s) => s.currentWorkspaceId);
  return useQuery({
    queryKey: [...dashboardKeys.list(kind, projectId, wsId), size] as const,
    queryFn: () => dashboardApi.list(kind, projectId, 0, size, wsId ?? undefined),
  });
}

// 프로젝트 보고서(WMP-HOME-003) — 보고서 탭.
export function useProjectReport(projectId?: number) {
  return useQuery({
    queryKey: ['dashboard', 'report', projectId] as const,
    queryFn: () => dashboardApi.report(projectId!),
    enabled: !!projectId,
  });
}
