// AI 업무 초안 훅 (WMP-WI-019, CR-050). 생성/확정/전체버리기 후 백로그 무효화(초안 구역 갱신).
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { aiDraftApi, type AiDraftCreateRequest } from './api';
import { workItemApi } from '@/features/workitem/api';
import { backlogPrefix } from '@/features/agile/hooks';
import { ApiError } from '@/lib/api-client';

/** 초안 생성 — 서술→aimbase→draft 자동 입력. 성공 시 백로그(초안 구역) 갱신. */
export function useCreateAiDrafts(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AiDraftCreateRequest) => aiDraftApi.create(projectId, body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
      const n = res.created.length;
      if (res.failedCount > 0) {
        toast.warning(`초안 ${n}건 생성 (실패 ${res.failedCount}건)`);
      } else {
        toast.success(`AI 초안 ${n}건이 백로그에 추가되었습니다.`);
      }
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'AI 초안 생성에 실패했습니다.'),
  });
}

/** 초안 확정(draft→정식). ids 비우면 전체. */
export function useConfirmAiDrafts(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: number[]) => aiDraftApi.confirm(projectId, ids),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
      toast.success(`초안 ${res.count}건을 담았습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '초안 확정에 실패했습니다.'),
  });
}

/** 초안 전체 버리기(draft 소프트 삭제). */
export function useDiscardAiDrafts(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiDraftApi.discardAll(projectId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
      toast.success(`초안 ${res.count}건을 버렸습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '초안 버리기에 실패했습니다.'),
  });
}

/** 초안 개별 삭제 — 기존 소프트 삭제 API(DELETE /work-items/{id}) 재사용(초안도 일반 work_item). */
export function useDeleteDraftItem(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workItemId: number) => workItemApi.remove(workItemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '초안 삭제에 실패했습니다.'),
  });
}
