// 업무 상세 훅 — key 해소 + 상세 조회 + 부분수정/상태/담당자/측정/스프린트/하위작업/댓글/링크/활동/승인.
// 모든 변경은 성공 시 상세 쿼리 invalidate(서버 권위 재동기화). 보드/백로그 캐시는 화면 이탈 시 자연 갱신.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import {
  workItemApi, type UpdateWorkItemRequest, type CreateSubtaskRequest,
  type CreateCommentRequest, type CreateLinkRequest, type DecisionRequest,
  type CreateAttachmentRequest, type ConvertRequest, type CreateWorkItemRequest,
} from './api';
import { ApiError } from '@/lib/api-client';
import type { WorkItemResponse } from '@/types/domain';

export const wiDetailKey = (id?: number) => ['work-item', id] as const;
export const wiByKeyKey = (key?: string) => ['work-item-by-key', key] as const;

function errMsg(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback;
}

/**
 * 업무 생성(WMP-WI-001, §9.4). 성공 시 목록류 캐시 무효화 + 생성 토스트.
 * 연속 생성/상세 이동 분기는 호출부(모달)에서 onSuccess로 처리.
 */
export function useCreateWorkItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWorkItemRequest) => workItemApi.create(body),
    onSuccess: (created) => {
      // 백로그·보드·통합목록·검색 등 work_item 목록 캐시 광역 무효화.
      qc.invalidateQueries({ queryKey: ['work-items'] });
      qc.invalidateQueries({ queryKey: ['backlog'] });
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['search'] });
      toast.success(`업무 "${created.key}"가 생성되었습니다.`);
    },
    onError: (e) => toast.error(errMsg(e, '업무 생성에 실패했습니다.')),
  });
}

// keyword 검색 결과(부분일치 다건)에서 정확 key 1건만 골라낸다. 대소문자 무관 비교.
export function exactByKey(items: WorkItemResponse[], key: string): WorkItemResponse | undefined {
  return items.find((w) => w.key === key) ?? items.find((w) => w.key.toLowerCase() === key.toLowerCase());
}

/**
 * 라우트 :key(예: ZGOH-2) → 상세. keyword 검색으로 정확 key 매칭 1건을 골라낸다.
 * 검색 Response가 상세 전체 필드를 포함하므로 그대로 상세로 사용.
 */
export function useWorkItemByKey(key?: string) {
  return useQuery({
    queryKey: wiByKeyKey(key),
    queryFn: async () => {
      const page = await workItemApi.resolveByKey(key!);
      const exact = exactByKey(page.items, key!);
      if (!exact) throw new ApiError('NOT_FOUND', '업무를 찾을 수 없습니다.', 404);
      return exact;
    },
    enabled: !!key,
  });
}

/** 해소된 id 기준 단건 재조회(변경 후 신선한 본문). */
export function useWorkItem(id?: number) {
  return useQuery({
    queryKey: wiDetailKey(id),
    queryFn: () => workItemApi.get(id!),
    enabled: !!id,
  });
}

// 변경 후 상세(by-key + by-id) 모두 무효화하는 공통 onSuccess.
function useInvalidateDetail(id?: number, key?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: wiByKeyKey(key) });
    qc.invalidateQueries({ queryKey: wiDetailKey(id) });
  };
}

export function useUpdateWorkItem(id: number, key?: string) {
  const invalidate = useInvalidateDetail(id, key);
  return useMutation({
    mutationFn: (body: UpdateWorkItemRequest) => workItemApi.update(id, body),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(errMsg(e, '수정에 실패했습니다.')),
  });
}

export function useChangeStatus(id: number, key?: string) {
  const invalidate = useInvalidateDetail(id, key);
  return useMutation({
    mutationFn: ({ toStatusId, blockReason }: { toStatusId: number; blockReason?: string }) =>
      workItemApi.changeStatus(id, toStatusId, blockReason),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(errMsg(e, '상태 변경에 실패했습니다.')),
  });
}

export function useChangeAssignee(id: number, key?: string) {
  const invalidate = useInvalidateDetail(id, key);
  return useMutation({
    mutationFn: ({ assigneeId, reporterId }: { assigneeId: number | null; reporterId?: number | null }) =>
      workItemApi.changeAssignee(id, assigneeId, reporterId),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(errMsg(e, '담당자 변경에 실패했습니다.')),
  });
}

export function useUpdateMeasure(id: number, key?: string) {
  const invalidate = useInvalidateDetail(id, key);
  return useMutation({
    mutationFn: (body: { measureUnitId?: number | null; targetValue?: number | null; currentValue?: number | null }) =>
      workItemApi.updateMeasure(id, body),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(errMsg(e, '측정값 변경에 실패했습니다.')),
  });
}

export function useChangeSprint(id: number, key?: string) {
  const invalidate = useInvalidateDetail(id, key);
  return useMutation({
    mutationFn: (sprintId: number | null) => workItemApi.changeSprint(id, sprintId),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(errMsg(e, '스프린트 변경에 실패했습니다.')),
  });
}

// ── 하위 작업 ──
export const wiSubtasksKey = (projectId?: number) => ['work-items', 'project', projectId] as const;

/** 프로젝트 전체 항목(하위작업 해소용). 클라에서 parentId로 거른다. */
export function useProjectItems(projectId?: number) {
  return useQuery({
    queryKey: wiSubtasksKey(projectId),
    queryFn: async () => (await workItemApi.listByProject(projectId!)).items,
    enabled: !!projectId,
  });
}

export function useCreateSubtask(parentId: number, projectId?: number, key?: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateDetail(parentId, key);
  return useMutation({
    mutationFn: (body: CreateSubtaskRequest) => workItemApi.createSubtask(parentId, body),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: wiSubtasksKey(projectId) });
    },
    onError: (e) => toast.error(errMsg(e, '하위 작업 추가에 실패했습니다.')),
  });
}

// ── 댓글 ──
export const wiCommentsKey = (id?: number) => ['work-item', id, 'comments'] as const;
export function useComments(id?: number) {
  return useQuery({
    queryKey: wiCommentsKey(id),
    queryFn: () => workItemApi.listComments(id!),
    enabled: !!id,
  });
}
export function useCreateComment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommentRequest) => workItemApi.createComment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wiCommentsKey(id) });
      qc.invalidateQueries({ queryKey: wiActivitiesKey(id) });
    },
    onError: (e) => toast.error(errMsg(e, '댓글 등록에 실패했습니다.')),
  });
}

// ── 첨부 (WMP-WI-012) ──
export const wiAttachmentsKey = (id?: number) => ['work-item', id, 'attachments'] as const;
export function useAttachments(id?: number) {
  return useQuery({
    queryKey: wiAttachmentsKey(id),
    queryFn: () => workItemApi.listAttachments(id!),
    enabled: !!id,
  });
}
export function useCreateAttachment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAttachmentRequest) => workItemApi.createAttachment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wiAttachmentsKey(id) });
      qc.invalidateQueries({ queryKey: wiActivitiesKey(id) });
      toast.success('첨부를 추가했습니다.');
    },
    onError: (e) => toast.error(errMsg(e, '첨부 추가에 실패했습니다.')),
  });
}

// ── 삭제 (WMP-WI-003, 소프트) ──
export function useDeleteWorkItem(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => workItemApi.remove(id),
    onSuccess: () => {
      // 목록/보드/백로그 캐시 폭넓게 무효화(상세는 화면 이탈로 자연 정리).
      qc.invalidateQueries({ queryKey: ['work-items'] });
      qc.invalidateQueries({ queryKey: ['board'] });
      toast.success('업무를 삭제했습니다.');
    },
    onError: (e) => toast.error(errMsg(e, '삭제에 실패했습니다.')),
  });
}

// ── 유형 전환 (WMP-WI-014) ──
export function useConvert(id: number, key?: string) {
  const invalidate = useInvalidateDetail(id, key);
  return useMutation({
    mutationFn: (body: ConvertRequest) => workItemApi.convert(id, body),
    onSuccess: () => { invalidate(); toast.success('업무 유형을 전환했습니다.'); },
    onError: (e) => toast.error(errMsg(e, '유형 전환에 실패했습니다.')),
  });
}

// ── 연결된 업무 ──
export const wiLinksKey = (id?: number) => ['work-item', id, 'links'] as const;
export function useLinks(id?: number) {
  return useQuery({
    queryKey: wiLinksKey(id),
    queryFn: () => workItemApi.listLinks(id!),
    enabled: !!id,
  });
}
export function useCreateLink(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLinkRequest) => workItemApi.createLink(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: wiLinksKey(id) }),
    onError: (e) => toast.error(errMsg(e, '업무 연결에 실패했습니다.')),
  });
}
export function useDeleteLink(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: number) => workItemApi.deleteLink(id, linkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: wiLinksKey(id) }),
    onError: (e) => toast.error(errMsg(e, '연결 해제에 실패했습니다.')),
  });
}

// ── 활동 이력 ──
export const wiActivitiesKey = (id?: number) => ['work-item', id, 'activities'] as const;
export function useActivities(id?: number) {
  return useQuery({
    queryKey: wiActivitiesKey(id),
    queryFn: () => workItemApi.listActivities(id!),
    enabled: !!id,
  });
}

// ── 승인 게이트 ──
export const wiApprovalsKey = (id?: number) => ['work-item', id, 'approvals'] as const;
export function useApprovals(id?: number) {
  return useQuery({
    queryKey: wiApprovalsKey(id),
    queryFn: () => workItemApi.listApprovals(id!),
    enabled: !!id,
  });
}
export function useDecideApproval(workItemId: number, key?: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateDetail(workItemId, key);
  return useMutation({
    mutationFn: ({ approvalId, body }: { approvalId: number; body: DecisionRequest }) =>
      workItemApi.decideApproval(approvalId, body),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: wiApprovalsKey(workItemId) });
      qc.invalidateQueries({ queryKey: wiActivitiesKey(workItemId) });
    },
    onError: (e) => toast.error(errMsg(e, '승인 처리에 실패했습니다.')),
  });
}

// ── 측정 단위(이름/접미사 표시) ──
// OWNER/ADMIN 전용 엔드포인트라 비권한 사용자는 403 → 빈 맵으로 흡수(측정값 숫자만 표시).
export const measureUnitsKey = ['measure-units'] as const;
export function useMeasureUnits() {
  return useQuery({
    queryKey: measureUnitsKey,
    queryFn: async () => {
      try {
        return (await workItemApi.listMeasureUnits()).items;
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// 하위작업 해소 헬퍼 — 프로젝트 항목에서 parentId===id 거름.
export function pickSubtasks(items: WorkItemResponse[] | undefined, parentId: number): WorkItemResponse[] {
  return (items ?? []).filter((w) => w.parentId === parentId);
}
