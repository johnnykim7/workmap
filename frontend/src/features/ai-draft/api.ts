// AI 업무 초안 API (WMP-WI-019, CR-050, T3-2 §F4) — 실 BE 계약 기준.
// 백로그에서 서술 → aimbase → draft work_item. POST/GET/DELETE /projects/{id}/ai-drafts + POST .../confirm.
import { api } from '@/lib/api-client';
import type { WorkItemResponse } from '@/types/domain';

export type AiDraftMode = 'epic' | 'story_task';

export interface AiDraftCreateRequest {
  statement: string;
  mode: AiDraftMode;
  epicId?: number | null; // story_task 모드에서 대상 Epic
}

export interface AiDraftCreateResult {
  created: WorkItemResponse[];
  failedCount: number;
}

export interface AiDraftCountResult {
  count: number;
}

export const aiDraftApi = {
  create: (projectId: number, body: AiDraftCreateRequest) =>
    api.post<AiDraftCreateResult>(`/projects/${projectId}/ai-drafts`, body),
  list: (projectId: number) =>
    api.get<WorkItemResponse[]>(`/projects/${projectId}/ai-drafts`),
  // ids 비우면 전체 확정(draft→정식 전환).
  confirm: (projectId: number, ids?: number[]) =>
    api.post<AiDraftCountResult>(`/projects/${projectId}/ai-drafts/confirm`, { ids: ids ?? [] }),
  discardAll: (projectId: number) =>
    api.delete<AiDraftCountResult>(`/projects/${projectId}/ai-drafts`),
};
