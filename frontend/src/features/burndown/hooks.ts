// 번다운/벨로시티 훅 (WMP-AGL-006) — 조회 전용.
import { useQuery } from '@tanstack/react-query';
import { burndownApi } from './api';

export function useBurndown(sprintId?: number) {
  return useQuery({
    queryKey: ['burndown', sprintId],
    queryFn: () => burndownApi.burndown(sprintId!),
    enabled: !!sprintId,
  });
}

export function useVelocity(projectId?: number) {
  return useQuery({
    queryKey: ['velocity', projectId],
    queryFn: () => burndownApi.velocity(projectId!),
    enabled: !!projectId,
  });
}
