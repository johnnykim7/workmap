// 애자일 훅 — 백로그 조회, 스프린트 생성/시작/완료, 항목 스프린트 이동(낙관적+롤백).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { agileApi, type BacklogResponse, type CreateSprintRequest } from './api';
import { ApiError } from '@/lib/api-client';

export const backlogKey = (projectId?: number) => ['backlog', projectId] as const;

export function useBacklog(projectId?: number) {
  return useQuery({
    queryKey: backlogKey(projectId),
    queryFn: () => agileApi.backlog(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSprintRequest) => agileApi.createSprint(projectId, body),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: backlogKey(projectId) });
      toast.success(`스프린트 "${s.name}"가 생성되었습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '스프린트 생성에 실패했습니다.'),
  });
}

export function useStartSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, body }: { sprintId: number; body?: { startDate?: string; endDate?: string } }) =>
      agileApi.startSprint(sprintId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backlogKey(projectId) });
      qc.invalidateQueries({ queryKey: ['board', projectId] });
      toast.success('스프린트를 시작했습니다.');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '스프린트 시작에 실패했습니다.'),
  });
}

export function useCompleteSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, carryToSprintId }: { sprintId: number; carryToSprintId?: number }) =>
      agileApi.completeSprint(sprintId, carryToSprintId ? { carryToSprintId } : undefined),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: backlogKey(projectId) });
      qc.invalidateQueries({ queryKey: ['board', projectId] });
      toast.success(`스프린트 완료 — 완료 ${r.doneCount}건, 이월 ${r.carriedOverCount}건.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '스프린트 완료에 실패했습니다.'),
  });
}

/**
 * 항목 스프린트 이동(WMP-AGL-002). DnD 드롭 시 호출.
 * 낙관적: 백로그 캐시에서 항목을 출발 구역→도착 구역으로 즉시 이동. 실패 시 스냅샷 롤백(T1-5 UI FSM).
 */
export function useChangeItemSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workItemId, sprintId }: { workItemId: number; sprintId: number | null }) =>
      agileApi.changeItemSprint(workItemId, sprintId),
    onMutate: async ({ workItemId, sprintId }) => {
      await qc.cancelQueries({ queryKey: backlogKey(projectId) });
      const prev = qc.getQueryData<BacklogResponse>(backlogKey(projectId));
      if (prev) qc.setQueryData(backlogKey(projectId), moveItem(prev, workItemId, sprintId));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(backlogKey(projectId), ctx.prev);
      toast.error(err instanceof ApiError ? err.message : '항목 이동에 실패했습니다.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: backlogKey(projectId) }),
  });
}

// 백로그 응답에서 한 항목을 targetSprintId 구역으로 옮긴 새 응답을 만든다(불변).
// targetSprintId=null이면 백로그 구역으로. 카운트(itemCount/storyPointsSum)도 재계산.
export function moveItem(data: BacklogResponse, workItemId: number, targetSprintId: number | null): BacklogResponse {
  let moved: BacklogResponse['sprints'][number]['items'][number] | undefined;
  const strip = (items: BacklogResponse['sprints'][number]['items']) => {
    const next = items.filter((i) => {
      if (i.id === workItemId) { moved = i; return false; }
      return true;
    });
    return next;
  };
  const recount = (section: BacklogResponse['backlog']) => ({
    ...section,
    itemCount: section.items.length,
    storyPointsSum: section.items.reduce((s, i) => s + (i.storyPoints ?? 0), 0),
  });

  const sprints = data.sprints.map((sec) => ({ ...sec, items: strip(sec.items) }));
  const backlog = { ...data.backlog, items: strip(data.backlog.items) };
  if (!moved) return data; // 못 찾으면 변경 없음

  const placed = { ...moved, sprintId: targetSprintId };
  let nextSprints = sprints;
  let nextBacklog = backlog;
  if (targetSprintId === null) {
    nextBacklog = { ...backlog, items: [...backlog.items, placed] };
  } else {
    nextSprints = sprints.map((sec) =>
      sec.sprint?.id === targetSprintId ? { ...sec, items: [...sec.items, placed] } : sec,
    );
  }
  return {
    ...data,
    sprints: nextSprints.map(recount),
    backlog: recount(nextBacklog),
  };
}
