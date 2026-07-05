// 프로젝트 건강 지표 훅 (CR-043) — react-query. 프로젝트 단건, projectId 있을 때만 조회.
import { useQuery } from '@tanstack/react-query';
import { metricsApi } from './api';

export const metricsKeys = {
  health: (projectId?: number) => ['metrics', 'health', projectId] as const,
  aging: (projectId?: number) => ['metrics', 'aging', projectId] as const,
  rework: (projectId?: number) => ['metrics', 'rework', projectId] as const,
  workload: (projectId?: number) => ['metrics', 'workload', projectId] as const,
};

export function useHealth(projectId?: number) {
  return useQuery({
    queryKey: metricsKeys.health(projectId),
    queryFn: () => metricsApi.health(projectId!),
    enabled: !!projectId,
  });
}
export function useAging(projectId?: number) {
  return useQuery({
    queryKey: metricsKeys.aging(projectId),
    queryFn: () => metricsApi.aging(projectId!),
    enabled: !!projectId,
  });
}
export function useRework(projectId?: number) {
  return useQuery({
    queryKey: metricsKeys.rework(projectId),
    queryFn: () => metricsApi.rework(projectId!),
    enabled: !!projectId,
  });
}
export function useWorkload(projectId?: number) {
  return useQuery({
    queryKey: metricsKeys.workload(projectId),
    queryFn: () => metricsApi.workload(projectId!),
    enabled: !!projectId,
  });
}
