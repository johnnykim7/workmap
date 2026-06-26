// 승인 API (T3-2 H1, §9.5 승인 탭) — 실 BE 계약. 신규 BE 없음.
// 경로는 numeric projectId(문서 §9.5는 {key}로 적혀있으나 BE는 projectId). 호출측이 key→id 해소.
import { api } from '@/lib/api-client';
import type { Approval, ApprovalDecision, ApprovalState } from '@/types/domain';

export interface DecisionRequest {
  decision: ApprovalDecision;
  comment?: string;
  nextStatusId?: number;
  rejectStatusId?: number;
}

export const approvalApi = {
  // decision 필터: PENDING|APPROVED|REJECTED (미지정 = 전체). BE는 a.decision = #{decision} 매칭.
  listByProject: (projectId: number, decision?: ApprovalState) =>
    api.get<Approval[]>(`/projects/${projectId}/approvals${decision ? `?decision=${decision}` : ''}`),
  decide: (approvalId: number, body: DecisionRequest) =>
    api.post<Approval>(`/approvals/${approvalId}/decision`, body),
};
