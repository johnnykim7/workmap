// 현장검증 훅 (WMP-OPS-004) — 목록 조회 + 생성(후속 업무 생성 시 안내 토스트).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import { opsApi, type VerificationCreateRequest } from './api';

export function useVerifications(workItemId?: number) {
  return useQuery({
    queryKey: ['verifications', workItemId],
    queryFn: () => opsApi.listVerifications(workItemId!),
    enabled: !!workItemId,
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
