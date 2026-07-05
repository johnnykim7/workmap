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

// ── 2·3차 훅 ────────────────────────────────────────────────────
export function useCycleTime(projectId?: number) {
  return useQuery({
    queryKey: ['metrics', 'cycleTime', projectId] as const,
    queryFn: () => metricsApi.cycleTime(projectId!),
    enabled: !!projectId,
  });
}
export function useCfd(projectId?: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ['metrics', 'cfd', projectId, from, to] as const,
    queryFn: () => metricsApi.cfd(projectId!, from, to),
    enabled: !!projectId,
  });
}
export function useSayDo(projectId?: number) {
  return useQuery({
    queryKey: ['metrics', 'sayDo', projectId] as const,
    queryFn: () => metricsApi.sayDo(projectId!),
    enabled: !!projectId,
  });
}
export function useFieldVerification(projectId?: number) {
  return useQuery({
    queryKey: ['metrics', 'fieldVerification', projectId] as const,
    queryFn: () => metricsApi.fieldVerification(projectId!),
    enabled: !!projectId,
  });
}
export function useForecast(projectId?: number, targetDays = 14) {
  return useQuery({
    queryKey: ['metrics', 'forecast', projectId, targetDays] as const,
    queryFn: () => metricsApi.forecast(projectId!, targetDays),
    enabled: !!projectId,
  });
}
export function useEvm(projectId?: number) {
  return useQuery({
    queryKey: ['metrics', 'evm', projectId] as const,
    queryFn: () => metricsApi.evm(projectId!),
    enabled: !!projectId,
  });
}
export function useTeamWait(projectId?: number) {
  return useQuery({
    queryKey: ['metrics', 'teamWait', projectId] as const,
    queryFn: () => metricsApi.teamWait(projectId!),
    enabled: !!projectId,
  });
}
export function useOpsApply(projectId?: number) {
  return useQuery({
    queryKey: ['metrics', 'opsApply', projectId] as const,
    queryFn: () => metricsApi.opsApply(projectId!),
    enabled: !!projectId,
  });
}
