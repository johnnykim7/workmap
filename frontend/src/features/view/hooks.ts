// 보기(타임라인/캘린더) 훅 — 프로젝트 단위 조회. board 패턴과 동일(TanStack Query).
import { useQuery } from '@tanstack/react-query';
import { viewApi } from './api';

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
