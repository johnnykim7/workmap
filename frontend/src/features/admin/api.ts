// 관리자 마스터 API (T3-2 §H, WMP-ADM-001~003) — 실 BE AdminController 계약 기준.
// 모든 엔드포인트 OWNER/ADMIN 전용(@PreAuthorize). 측정단위·필드스킴·워크플로 CRUD + 워크플로 상태/전이.
import { api, type PageResponse } from '@/lib/api-client';

// ───────────────────────── 측정 단위 (WMP-ADM-001) ─────────────────────────
export type MeasureValueType = 'NUMBER' | 'BOOLEAN' | 'SELECT';

export interface MeasureUnitResponse {
  id: number;
  name: string;
  valueType: MeasureValueType;
  suffix: string | null;
  options: string[] | null;
  isSystem: boolean;
  sortOrder: number;
}
export interface MeasureUnitRequest {
  name: string;
  valueType: MeasureValueType;
  suffix?: string | null;
  options?: string[] | null;
  sortOrder?: number | null;
}

// ───────────────────────── 필드 스킴 (WMP-ADM-002) ─────────────────────────
export interface FieldSchemeResponse {
  id: number;
  projectId: number | null;
  issueTypeCode: string;
  fieldKey: string;
  isVisible: boolean;
  isRequired: boolean;
  sortOrder: number;
}
export interface FieldSchemeRequest {
  projectId?: number | null;
  issueTypeCode: string;
  fieldKey: string;
  isVisible?: boolean | null;
  isRequired?: boolean | null;
  sortOrder?: number | null;
}

// ───────────────────────── 워크플로 (WMP-ADM-003) ─────────────────────────
export interface WorkflowResponse {
  id: number;
  name: string;
  isSystem: boolean;
}
export interface WorkflowRequest {
  name: string;
}
export interface WorkflowStatusResponse {
  id: number;
  workflowId: number;
  code: string;
  label: string;
  commonStatus: string;
  isStart: boolean;
  isDone: boolean;
  isApproval: boolean;
  approverRole: string | null;
  sortOrder: number;
}
export interface WorkflowStatusRequest {
  code: string;
  label: string;
  commonStatus: string;
  isStart?: boolean | null;
  isDone?: boolean | null;
  isApproval?: boolean | null;
  approverRole?: string | null;
  sortOrder?: number | null;
}
export interface WorkflowTransitionResponse {
  id: number;
  workflowId: number;
  fromStatusId: number;
  toStatusId: number;
}
export interface WorkflowTransitionRequest {
  fromStatusId: number;
  toStatusId: number;
}

function pageQs(page = 0, size = 20, extra?: Record<string, string | number | undefined>) {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (extra) for (const [k, v] of Object.entries(extra)) if (v != null && v !== '') p.set(k, String(v));
  return p.toString();
}

export const adminApi = {
  // 측정 단위
  measureUnits: {
    list: (page = 0, size = 20) =>
      api.get<PageResponse<MeasureUnitResponse>>(`/admin/measure-units?${pageQs(page, size)}`),
    create: (body: MeasureUnitRequest) =>
      api.post<MeasureUnitResponse>('/admin/measure-units', body),
    update: (id: number, body: MeasureUnitRequest) =>
      api.put<MeasureUnitResponse>(`/admin/measure-units/${id}`, body),
    remove: (id: number) => api.delete<void>(`/admin/measure-units/${id}`),
  },
  // 필드 스킴
  fieldSchemes: {
    list: (params: { projectId?: number; issueTypeCode?: string; page?: number; size?: number } = {}) =>
      api.get<PageResponse<FieldSchemeResponse>>(
        `/admin/field-schemes?${pageQs(params.page, params.size, {
          projectId: params.projectId,
          issueTypeCode: params.issueTypeCode,
        })}`,
      ),
    create: (body: FieldSchemeRequest) =>
      api.post<FieldSchemeResponse>('/admin/field-schemes', body),
    update: (id: number, body: FieldSchemeRequest) =>
      api.put<FieldSchemeResponse>(`/admin/field-schemes/${id}`, body),
    remove: (id: number) => api.delete<void>(`/admin/field-schemes/${id}`),
  },
  // 워크플로
  workflows: {
    list: (page = 0, size = 20) =>
      api.get<PageResponse<WorkflowResponse>>(`/admin/workflows?${pageQs(page, size)}`),
    create: (body: WorkflowRequest) => api.post<WorkflowResponse>('/admin/workflows', body),
    update: (id: number, body: WorkflowRequest) =>
      api.put<WorkflowResponse>(`/admin/workflows/${id}`, body),
    remove: (id: number) => api.delete<void>(`/admin/workflows/${id}`),

    listStatuses: (id: number) =>
      api.get<WorkflowStatusResponse[]>(`/admin/workflows/${id}/statuses`),
    addStatus: (id: number, body: WorkflowStatusRequest) =>
      api.post<WorkflowStatusResponse>(`/admin/workflows/${id}/statuses`, body),
    updateStatus: (id: number, statusId: number, body: WorkflowStatusRequest) =>
      api.put<WorkflowStatusResponse>(`/admin/workflows/${id}/statuses/${statusId}`, body),
    removeStatus: (id: number, statusId: number) =>
      api.delete<void>(`/admin/workflows/${id}/statuses/${statusId}`),

    listTransitions: (id: number) =>
      api.get<WorkflowTransitionResponse[]>(`/admin/workflows/${id}/transitions`),
    addTransition: (id: number, body: WorkflowTransitionRequest) =>
      api.post<WorkflowTransitionResponse>(`/admin/workflows/${id}/transitions`, body),
    removeTransition: (id: number, transitionId: number) =>
      api.delete<void>(`/admin/workflows/${id}/transitions/${transitionId}`),
  },
};
