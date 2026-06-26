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

export const opsApi = {
  listVerifications: (workItemId: number) =>
    api.get<VerificationResponse[]>(`/work-items/${workItemId}/field-verifications`),
  createVerification: (workItemId: number, body: VerificationCreateRequest) =>
    api.post<VerificationCreateResult>(`/work-items/${workItemId}/field-verifications`, body),
};
