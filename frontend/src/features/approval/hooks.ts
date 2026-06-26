// 승인 탭 훅 — 프로젝트 승인 목록(토글 필터) + 승인/거부 처리(성공 시 목록 갱신).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { approvalApi, type DecisionRequest } from './api';
import { ApiError } from '@/lib/api-client';
import type { ApprovalState } from '@/types/domain';

export const projectApprovalsKey = (projectId?: number, decision?: ApprovalState) =>
  ['project-approvals', projectId, decision ?? 'ALL'] as const;

export function useProjectApprovals(projectId?: number, decision?: ApprovalState) {
  return useQuery({
    queryKey: projectApprovalsKey(projectId, decision),
    queryFn: () => approvalApi.listByProject(projectId!, decision),
    enabled: !!projectId,
  });
}

export function useDecideProjectApproval(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, body }: { approvalId: number; body: DecisionRequest }) =>
      approvalApi.decide(approvalId, body),
    onSuccess: () => {
      // 모든 토글 캐시 + 해당 항목 상세/보드 무효화
      qc.invalidateQueries({ queryKey: ['project-approvals', projectId] });
      qc.invalidateQueries({ queryKey: ['board', projectId] });
      qc.invalidateQueries({ queryKey: ['work-item-by-key'] });
      toast.success('승인 처리했습니다.');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '승인 처리에 실패했습니다.'),
  });
}
