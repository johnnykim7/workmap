// 현장검증 훅 (WMP-OPS-004) — 목록 조회 + 생성(후속 업무 생성 시 안내 토스트).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { opsApi, type VerificationCreateRequest, type PromoteRequest } from './api';

export function useVerifications(workItemId?: number) {
  return useQuery({
    queryKey: ['verifications', workItemId],
    queryFn: () => opsApi.listVerifications(workItemId!),
    enabled: !!workItemId,
  });
}

// 처리량(WMP-OPS-002) — 기간 내 담당자별 완료 건수.
export function useThroughput(projectId?: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ['throughput', projectId, from ?? null, to ?? null],
    queryFn: () => opsApi.throughput(projectId!, from, to),
    enabled: !!projectId,
  });
}

// 백로그 전환(WMP-OPS-003) — 현장이슈→개발 백로그. 성공 시 생성 항목 key 토스트.
export function usePromoteToBacklog(workItemId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PromoteRequest) => opsApi.promoteToBacklog(workItemId, body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['work-item', workItemId, 'links'] });
      toast.success(`백로그로 전환했습니다 (${res.promoted.key}).`);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '백로그 전환에 실패했습니다.'),
  });
}

export function useCreateVerification(workItemId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: VerificationCreateRequest) => opsApi.createVerification(workItemId, body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['verifications', workItemId] });
      if (res.followUp) {
        toast.success(`현장검증 기록 완료 — 후속 업무 생성됨 (${res.followUp.key}).`);
      } else {
        toast.success('현장검증 기록을 저장했습니다.');
      }
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '현장검증 기록에 실패했습니다.'),
  });
}
