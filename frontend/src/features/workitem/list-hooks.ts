// 통합 목록 + 벌크편집 훅 — 페이징 검색(이전 데이터 유지) + 벌크(성공/실패 분리 토스트).
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { workListApi, type WorkItemListParams, type BulkRequest } from './list-api';
import { ApiError } from '@/lib/api-client';

export const workListKey = (params: WorkItemListParams) => ['work-list', params] as const;

export function useWorkItems(params: WorkItemListParams, enabled = true) {
  return useQuery({
    queryKey: workListKey(params),
    queryFn: () => workListApi.search(params),
    enabled: enabled && !!params.projectId,
    placeholderData: keepPreviousData, // 페이지/필터 전환 시 깜빡임 방지
  });
}

export function useBulkUpdate(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkRequest) => workListApi.bulk(body),
    onSuccess: (res) => {
      // 목록·보드·백로그 모두 영향 → 프로젝트 관련 캐시 광범위 무효화
      qc.invalidateQueries({ queryKey: ['work-list'] });
      qc.invalidateQueries({ queryKey: ['board', projectId] });
      qc.invalidateQueries({ queryKey: ['backlog', projectId] });
      if (res.failed.length === 0) {
        toast.success(`${res.succeeded.length}건 변경했습니다.`);
      } else {
        toast.warning(`${res.succeeded.length}건 성공 · ${res.failed.length}건 실패(FSM 거부 등).`);
      }
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : '일괄 변경에 실패했습니다.'),
  });
}
