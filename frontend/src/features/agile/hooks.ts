// 애자일 훅 — 백로그 조회, 스프린트 생성/시작/완료, 항목 스프린트 이동(낙관적+롤백).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { agileApi, type BacklogResponse, type CreateSprintRequest, type UpdateSprintRequest } from './api';
import { ApiError } from '@/lib/api-client';

// includeCompleted가 캐시 키에 포함돼야 토글 on/off가 서로 다른 응답으로 캐시됨(CR-041).
export const backlogKey = (projectId?: number, includeCompleted = false) =>
  ['backlog', projectId, includeCompleted] as const;
// 무효화/낙관적 갱신은 두 변형(false/true) 모두 대상 — prefix 매칭.
export const backlogPrefix = (projectId?: number) => ['backlog', projectId] as const;
export const sprintsKey = (projectId?: number) => ['sprints', projectId] as const;

export function useBacklog(projectId?: number, includeCompleted = false) {
  return useQuery({
    queryKey: backlogKey(projectId, includeCompleted),
    queryFn: () => agileApi.backlog(projectId!, includeCompleted),
    enabled: !!projectId,
  });
}

/** 프로젝트 스프린트 목록(상세 패널 Sprint Select 등). */
export function useSprints(projectId?: number) {
  return useQuery({
    queryKey: sprintsKey(projectId),
    queryFn: () => agileApi.listSprints(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSprintRequest) => agileApi.createSprint(projectId, body),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
      toast.success(`스프린트 "${s.name}"가 생성되었습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '스프린트 생성에 실패했습니다.'),
  });
}

/** 스프린트 편집(WMP-AGL-007, CR-038). status 무변경. */
export function useUpdateSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, body }: { sprintId: number; body: UpdateSprintRequest }) =>
      agileApi.updateSprint(sprintId, body),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
      qc.invalidateQueries({ queryKey: sprintsKey(projectId) });
      toast.success(`스프린트 "${s.name}"를 수정했습니다.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '스프린트 수정에 실패했습니다.'),
  });
}

/** 스프린트 삭제(WMP-AGL-008, CR-038). FUTURE만, 담긴 항목 백로그 복귀. */
export function useDeleteSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: number) => agileApi.deleteSprint(sprintId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
      qc.invalidateQueries({ queryKey: sprintsKey(projectId) });
      toast.success(
        r.returnedToBacklog > 0
          ? `스프린트를 삭제했습니다. 항목 ${r.returnedToBacklog}건을 백로그로 되돌렸습니다.`
          : '스프린트를 삭제했습니다.',
      );
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '스프린트 삭제에 실패했습니다.'),
  });
}

export function useStartSprint(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sprintId, body }: { sprintId: number; body?: { startDate?: string; endDate?: string } }) =>
      agileApi.startSprint(sprintId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
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
      qc.invalidateQueries({ queryKey: backlogPrefix(projectId) });
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
      // 토글 on/off 두 변형(false/true) 캐시 모두 낙관적 갱신·스냅샷(prefix 매칭, CR-041).
      await qc.cancelQueries({ queryKey: backlogPrefix(projectId) });
      const prev = qc.getQueriesData<BacklogResponse>({ queryKey: backlogPrefix(projectId) });
      prev.forEach(([key, data]) => {
        if (data) qc.setQueryData(key, moveItem(data, workItemId, sprintId));
      });
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(err instanceof ApiError ? err.message : '항목 이동에 실패했습니다.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: backlogPrefix(projectId) }),
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
