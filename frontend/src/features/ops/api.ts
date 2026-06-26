// 현장검증 API (WMP-OPS-004, CR-012) — OperationsController 계약 기준.
// 기록 목록 조회 + 기록 생성(옵션: 발견 이슈 → 후속 업무 자동 생성, 원본↔후속 RELATES_TO).
import { api } from '@/lib/api-client';
import type { WorkItemResponse } from '@/types/domain';

export type VerificationResult = 'PASS' | 'FAIL' | 'PARTIAL';

export interface VerificationResponse {
  id: number;
  workItemId: number;
  verifier: string;
  verifiedDate: string;            // LocalDate
  location: string | null;
  environment: string | null;
  testContent: string | null;
  result: VerificationResult;
  issuesFound: string | null;
  createdAt: string;
}

export interface VerificationCreateRequest {
  verifier: string;
  verifiedDate: string;            // yyyy-mm-dd
  location?: string | null;
  environment?: string | null;
  testContent?: string | null;
  result: VerificationResult;
  issuesFound?: string | null;
  createFollowUp: boolean;         // 발견 이슈 → 후속 업무 생성
  followUpProjectId?: number | null;
  followUpIssueType?: string | null;
}

export interface VerificationCreateResult {
  verification: VerificationResponse;
  followUp: WorkItemResponse | null;
}

// ───────────────────────── 처리량 (WMP-OPS-002) ─────────────────────────
export interface AssigneeThroughput {
  assigneeId: number | null;     // null = 미배정
  doneCount: number;
}
export interface ThroughputResponse {
  projectId: number;
  from: string | null;
  to: string | null;
  totalDone: number;
  byAssignee: AssigneeThroughput[];
}

// ───────────────────────── 백로그 전환 (WMP-OPS-003) ─────────────────────────
export interface PromoteRequest {
  targetProjectId?: number | null;   // 개발 프로젝트 id
  issueType?: string | null;         // 기본 STORY
  title?: string | null;             // 미지정 시 원본 title
  description?: string | null;
}
export interface PromoteResult {
  originId: number;
  promoted: WorkItemResponse;
}

function throughputQs(from?: string, to?: string) {
  const p = new URLSearchParams();
  if (from) p.set('from', from);
  if (to) p.set('to', to);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const opsApi = {
  listVerifications: (workItemId: number) =>
    api.get<VerificationResponse[]>(`/work-items/${workItemId}/field-verifications`),
  createVerification: (workItemId: number, body: VerificationCreateRequest) =>
    api.post<VerificationCreateResult>(`/work-items/${workItemId}/field-verifications`, body),

  throughput: (projectId: number, from?: string, to?: string) =>
    api.get<ThroughputResponse>(`/projects/${projectId}/throughput${throughputQs(from, to)}`),

  promoteToBacklog: (workItemId: number, body: PromoteRequest) =>
    api.post<PromoteResult>(`/work-items/${workItemId}/promote-to-backlog`, body),
};
