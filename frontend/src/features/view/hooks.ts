// 보기(타임라인/캘린더) 훅 — 프로젝트 단위 조회. board 패턴과 동일(TanStack Query).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { workItemApi } from '@/features/workitem/api';
import { workListApi } from '@/features/workitem/list-api';
import { viewApi, type CalendarResponse, type TimelineResponse } from './api';
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

// 타임라인 간트 막대 드래그/리사이즈 → start_date·due_date 변경(CR-035, WMP-VIEW-005).
// PATCH /work-items/{id} {startDate, dueDate} 재사용. 낙관적 업데이트 — timeline 쿼리의 해당
// 항목 날짜를 즉시 갱신하고 실패 시 스냅샷 롤백(서버 권위). 캘린더 dueDate 이동과 동일 패턴.
export function useMoveTimelineDates(projectId?: number) {
  const qc = useQueryClient();
  const key = timelineKey(projectId);
  return useMutation({
    mutationFn: ({ itemId, startDate, dueDate }: { itemId: number; startDate?: string; dueDate?: string }) =>
      workItemApi.update(itemId, { startDate, dueDate }),
    onMutate: async ({ itemId, startDate, dueDate }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TimelineResponse>(key);
      if (prev) {
        qc.setQueryData<TimelineResponse>(key, {
          ...prev,
          items: prev.items.map((it) =>
            it.id === itemId
              ? { ...it, startDate: startDate ?? it.startDate, dueDate: dueDate ?? it.dueDate }
              : it,
          ),
        });
      }
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(e instanceof Error ? e.message : '일정 변경에 실패했습니다.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}
