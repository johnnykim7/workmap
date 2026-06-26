// 관리자 마스터 훅 — 측정단위/필드스킴/워크플로 목록·CRUD. 성공/실패 토스트 + 캐시 무효화.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@therecommerce/ds-ui';
import { ApiError } from '@/lib/api-client';
import {
  adminApi,
  type MeasureUnitRequest,
  type FieldSchemeRequest,
  type WorkflowRequest,
  type WorkflowStatusRequest,
  type WorkflowTransitionRequest,
} from './api';

const msg = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

// ───────────────────────── 측정 단위 ─────────────────────────
const measureKey = (page: number) => ['admin', 'measure-units', page] as const;

export function useMeasureUnits(page = 0, size = 20) {
  return useQuery({
    queryKey: measureKey(page),
    queryFn: () => adminApi.measureUnits.list(page, size),
  });
}

export function useMeasureUnitMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'measure-units'] });

  const create = useMutation({
    mutationFn: (body: MeasureUnitRequest) => adminApi.measureUnits.create(body),
    onSuccess: () => { invalidate(); toast.success('측정 단위를 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '추가에 실패했습니다.')),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: MeasureUnitRequest }) =>
      adminApi.measureUnits.update(id, body),
    onSuccess: () => { invalidate(); toast.success('측정 단위를 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminApi.measureUnits.remove(id),
    onSuccess: () => { invalidate(); toast.success('측정 단위를 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '삭제에 실패했습니다.')),
  });
  return { create, update, remove };
}

// ───────────────────────── 필드 스킴 ─────────────────────────
export function useFieldSchemes(params: { projectId?: number; issueTypeCode?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'field-schemes', params],
    queryFn: () => adminApi.fieldSchemes.list(params),
  });
}

export function useFieldSchemeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'field-schemes'] });

  const create = useMutation({
    mutationFn: (body: FieldSchemeRequest) => adminApi.fieldSchemes.create(body),
    onSuccess: () => { invalidate(); toast.success('필드 스킴을 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '추가에 실패했습니다.')),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: FieldSchemeRequest }) =>
      adminApi.fieldSchemes.update(id, body),
    onSuccess: () => { invalidate(); toast.success('필드 스킴을 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminApi.fieldSchemes.remove(id),
    onSuccess: () => { invalidate(); toast.success('필드 스킴을 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '삭제에 실패했습니다.')),
  });
  return { create, update, remove };
}

// ───────────────────────── 워크플로 ─────────────────────────
export function useWorkflows(page = 0, size = 20) {
  return useQuery({
    queryKey: ['admin', 'workflows', page],
    queryFn: () => adminApi.workflows.list(page, size),
  });
}

export function useWorkflowMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'workflows'] });

  const create = useMutation({
    mutationFn: (body: WorkflowRequest) => adminApi.workflows.create(body),
    onSuccess: () => { invalidate(); toast.success('워크플로를 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '추가에 실패했습니다.')),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: WorkflowRequest }) =>
      adminApi.workflows.update(id, body),
    onSuccess: () => { invalidate(); toast.success('워크플로 이름을 수정했습니다.'); },
    onError: (e) => toast.error(msg(e, '수정에 실패했습니다.')),
  });
  const remove = useMutation({
    mutationFn: (id: number) => adminApi.workflows.remove(id),
    onSuccess: () => { invalidate(); toast.success('워크플로를 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '삭제에 실패했습니다.')),
  });
  return { create, update, remove };
}

// 워크플로 상세(상태/전이) — 선택된 워크플로 1개 기준.
export function useWorkflowStatuses(workflowId?: number) {
  return useQuery({
    queryKey: ['admin', 'workflow', workflowId, 'statuses'],
    queryFn: () => adminApi.workflows.listStatuses(workflowId!),
    enabled: !!workflowId,
  });
}
export function useWorkflowTransitions(workflowId?: number) {
  return useQuery({
    queryKey: ['admin', 'workflow', workflowId, 'transitions'],
    queryFn: () => adminApi.workflows.listTransitions(workflowId!),
    enabled: !!workflowId,
  });
}

export function useWorkflowDetailMutations(workflowId?: number) {
  const qc = useQueryClient();
  const invStatuses = () =>
    qc.invalidateQueries({ queryKey: ['admin', 'workflow', workflowId, 'statuses'] });
  const invTransitions = () =>
    qc.invalidateQueries({ queryKey: ['admin', 'workflow', workflowId, 'transitions'] });

  const addStatus = useMutation({
    mutationFn: (body: WorkflowStatusRequest) => adminApi.workflows.addStatus(workflowId!, body),
    onSuccess: () => { invStatuses(); toast.success('상태를 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '상태 추가에 실패했습니다.')),
  });
  const removeStatus = useMutation({
    mutationFn: (statusId: number) => adminApi.workflows.removeStatus(workflowId!, statusId),
    onSuccess: () => { invStatuses(); invTransitions(); toast.success('상태를 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '상태 삭제에 실패했습니다.')),
  });
  const addTransition = useMutation({
    mutationFn: (body: WorkflowTransitionRequest) =>
      adminApi.workflows.addTransition(workflowId!, body),
    onSuccess: () => { invTransitions(); toast.success('전이를 추가했습니다.'); },
    onError: (e) => toast.error(msg(e, '전이 추가에 실패했습니다.')),
  });
  const removeTransition = useMutation({
    mutationFn: (transitionId: number) =>
      adminApi.workflows.removeTransition(workflowId!, transitionId),
    onSuccess: () => { invTransitions(); toast.success('전이를 삭제했습니다.'); },
    onError: (e) => toast.error(msg(e, '전이 삭제에 실패했습니다.')),
  });
  return { addStatus, removeStatus, addTransition, removeTransition };
}
