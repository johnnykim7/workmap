// 보드 훅 — 보드 조회 + 상태 전이(낙관적 업데이트 + 서버 권위 롤백, T1-5 UI FSM).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { boardApi, type BoardResponse } from './api';
import { ApiError } from '@/lib/api-client';

export const boardKey = (projectId?: number) => ['board', projectId] as const;

export function useBoard(projectId?: number) {
  return useQuery({
    queryKey: boardKey(projectId),
    queryFn: () => boardApi.board(projectId!),
    enabled: !!projectId,
  });
}

/**
 * 상태 전이(드래그 드롭). 낙관적: 카드를 출발 컬럼→도착 컬럼으로 즉시 이동.
 * 실패(FSM 거부 등) 시 스냅샷 롤백 + 토스트. 성공/실패 모두 invalidate로 서버 권위 재동기화.
 */
export function useChangeStatus(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workItemId, toStatusId, blockReason }: { workItemId: number; toStatusId: number; blockReason?: string }) =>
      boardApi.changeStatus(workItemId, toStatusId, blockReason),
    onMutate: async ({ workItemId, toStatusId, blockReason }) => {
      await qc.cancelQueries({ queryKey: boardKey(projectId) });
      const prev = qc.getQueryData<BoardResponse>(boardKey(projectId));
      if (prev) qc.setQueryData(boardKey(projectId), moveCard(prev, workItemId, toStatusId, blockReason));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(boardKey(projectId), ctx.prev);
      toast.error(err instanceof ApiError ? err.message : '상태 변경에 실패했습니다.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: boardKey(projectId) }),
  });
}

// 보드 응답에서 카드 1개를 toStatusId 컬럼으로 옮긴 새 응답을 만든다(불변).
// statusId/commonStatus/blockReason을 도착 컬럼 기준으로 갱신. 카드를 못 찾으면 원본 반환.
export function moveCard(data: BoardResponse, workItemId: number, toStatusId: number, blockReason?: string): BoardResponse {
  const target = data.columns.find((c) => c.statusId === toStatusId);
  if (!target) return data;
  let card: BoardResponse['columns'][number]['cards'][number] | undefined;
  const stripped = data.columns.map((col) => ({
    ...col,
    cards: col.cards.filter((c) => {
      if (c.id === workItemId) { card = c; return false; }
      return true;
    }),
  }));
  if (!card) return data;
  const placed = {
    ...card,
    statusId: toStatusId,
    commonStatus: target.commonStatus,
    blockReason: target.commonStatus === 'BLOCKED' ? (blockReason ?? card.blockReason) : null,
  };
  return {
    ...data,
    columns: stripped.map((col) =>
      col.statusId === toStatusId ? { ...col, cards: [...col.cards, placed] } : col,
    ),
  };
}
