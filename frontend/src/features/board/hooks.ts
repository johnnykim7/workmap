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
    mutationFn: ({ workItemId, toStatusId }: { workItemId: number; toStatusId: number }) =>
      boardApi.changeStatus(workItemId, toStatusId),
    onMutate: async ({ workItemId, toStatusId }) => {
      await qc.cancelQueries({ queryKey: boardKey(projectId) });
      const prev = qc.getQueryData<BoardResponse>(boardKey(projectId));
      if (prev) qc.setQueryData(boardKey(projectId), moveCard(prev, workItemId, toStatusId));
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
// statusId/commonStatus를 도착 컬럼 기준으로 갱신. 막힘(flagged/blockReason)은 상태와 독립이라 그대로 유지(CR-040).
// 카드를 못 찾으면 원본 반환.
type Col = BoardResponse['groups'][number]['columns'][number];
type Card = Col['cards'][number];

export function moveCard(data: BoardResponse, workItemId: number, toStatusId: number): BoardResponse {
  // CR-039: groups[]가 여러 개고 같은 워크플로라 statusId가 그룹 간 동일하므로,
  // 카드가 실제 속한 그룹만 골라 그 그룹 columns 안에서만 이동한다(다른 스프린트 섹션 오염 방지).
  return {
    ...data,
    groups: data.groups.map((group) => {
      const hasCard = group.columns.some((c) => c.cards.some((card) => card.id === workItemId));
      const target = group.columns.find((c) => c.statusId === toStatusId);
      if (!hasCard || !target) return group; // 카드 없는 그룹은 그대로

      let card: Card | undefined;
      const stripped = group.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => {
          if (c.id === workItemId) { card = c; return false; }
          return true;
        }),
      }));
      if (!card) return group;
      const placed: Card = {
        ...card,
        statusId: toStatusId,
        commonStatus: target.commonStatus,
      };
      return {
        ...group,
        columns: stripped.map((col) =>
          col.statusId === toStatusId ? { ...col, cards: [...col.cards, placed] } : col,
        ),
      };
    }),
  };
}
