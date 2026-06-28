// 보기(타임라인/캘린더) 훅 — 프로젝트 단위 조회. board 패턴과 동일(TanStack Query).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { workItemApi } from '@/features/workitem/api';
import { workListApi } from '@/features/workitem/list-api';
import { viewApi, type CalendarResponse } from './api';
import { moveCalendarItem } from './calendar-util';

export const timelineKey = (projectId?: number) => ['timeline', projectId] as const;
export const calendarKey = (projectId?: number, year?: number, month?: number) =>
  ['calendar', projectId, year, month] as const;

export function useTimeline(projectId?: number) {
  return useQuery({
    queryKey: timelineKey(projectId),
    queryFn: () => viewApi.timeline(projectId!),
    enabled: !!projectId,
  });
}

export function useCalendar(projectId?: number, year?: number, month?: number) {
  return useQuery({
    queryKey: calendarKey(projectId, year, month),
    queryFn: () => viewApi.calendar(projectId!, year, month),
    enabled: !!projectId,
  });
}

// 타임라인 에픽 그룹/필터용 에픽 목록(CR-023) — issueType=EPIC work_item 조회. id→title 매핑에 사용.
export const projectEpicsKey = (projectId?: number) => ['project-epics', projectId] as const;
export function useProjectEpics(projectId?: number) {
  return useQuery({
    queryKey: projectEpicsKey(projectId),
    queryFn: () => workListApi.search({ projectId: projectId!, issueType: 'EPIC', size: 200 }),
    enabled: !!projectId,
    select: (res) => res.items, // PageResponse<WorkItemResponse> → 항목만
  });
}

// 캘린더 칩 드래그 → 마감일 변경(CR-021). PATCH /work-items/{id} {dueDate} 재사용.
// 낙관적 업데이트: 현재 보고 있는 캘린더 쿼리에서 항목을 새 날짜로 즉시 옮기고,
// 실패 시 스냅샷으로 롤백한다(서버 권위). board 칸반 낙관 패턴과 동일.
export function useMoveCalendarDueDate(projectId?: number, year?: number, month?: number) {
  const qc = useQueryClient();
  const key = calendarKey(projectId, year, month);
  return useMutation({
    mutationFn: ({ itemId, dueDate }: { itemId: number; dueDate: string }) =>
      workItemApi.update(itemId, { dueDate }),
    onMutate: async ({ itemId, dueDate }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<CalendarResponse>(key);
      if (prev) qc.setQueryData<CalendarResponse>(key, moveCalendarItem(prev, itemId, dueDate));
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(e instanceof Error ? e.message : '마감일 변경에 실패했습니다.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}
