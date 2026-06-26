// 업무 상세 API (T3-2 §F/F1/F2/H, §9.3) — 실 BE 계약 기준. 신규 BE 없음.
// 주의: 라우트 :key는 업무 비즈니스 key(예: ZGOH-2)이고 BE 상세 조회는 numeric id.
// BE에 by-key 단건 엔드포인트가 없어 GET /work-items?keyword={key}로 정확 매칭 해소한다.
import { api, type PageResponse } from '@/lib/api-client';
import type {
  WorkItemResponse, Comment, LinkView, LinkType, Activity, Approval, ApprovalDecision, Priority,
} from '@/types/domain';

// PATCH /work-items/{id} 부분수정(WMP-WI). 보낸 필드만 갱신.
export interface UpdateWorkItemRequest {
  title?: string;
  description?: string;
  priority?: Priority;
  epicId?: number | null;
  storyPoints?: number | null;
  estimateHours?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  acceptanceCriteria?: string[];
  stepsToReproduce?: string[];
  expectedResult?: string;
  actualResult?: string;
  environment?: string;
  severity?: string;
  checklist?: string;
  labels?: string[];
  relatedSolutions?: string[];
}

export interface CreateSubtaskRequest {
  title: string;
  assigneeId?: number | null;
  priority?: Priority;
}

export interface CreateCommentRequest {
  content: string;
  mentionedUserIds?: number[];
}

export interface CreateLinkRequest {
  linkType: LinkType;
  targetId: number;
}

// 첨부(WMP-WI-012, T3-2 F2) — BE는 파일 메타데이터(경로/URL) 등록 방식(바이너리 업로드 아님).
export interface CreateAttachmentRequest {
  fileName: string;
  filePath: string;            // URL 또는 경로
  fileSize?: number | null;
  contentType?: string | null;
}
export interface Attachment {
  id: number;
  workItemId: number;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  contentType: string | null;
  uploadedBy: number;
  createdAt: string;
}

// 유형 전환(WMP-WI-014) — issueType 변경 + 부모/Epic 재지정. PATCH /work-items/{id}/convert.
export interface ConvertRequest {
  issueType: string;
  parentId?: number | null;
  epicId?: number | null;
}

// POST /approvals/{id}/decision (APR-4/5). nextStatusId/rejectStatusId 미지정 시 결정만 기록.
export interface DecisionRequest {
  decision: ApprovalDecision;
  comment?: string;
  nextStatusId?: number;
  rejectStatusId?: number;
}

export const workItemApi = {
  // key→id 해소: keyword 검색은 title/key ILIKE 부분일치 → 정확 key 매칭만 골라낸다.
  resolveByKey: (key: string) =>
    api.get<PageResponse<WorkItemResponse>>(`/work-items?keyword=${encodeURIComponent(key)}&size=50`),

  get: (id: number) => api.get<WorkItemResponse>(`/work-items/${id}`),
  update: (id: number, body: UpdateWorkItemRequest) =>
    api.patch<WorkItemResponse>(`/work-items/${id}`, body),
  changeStatus: (id: number, toStatusId: number, blockReason?: string) =>
    api.patch<WorkItemResponse>(`/work-items/${id}/status`, { toStatusId, blockReason }),
  changeAssignee: (id: number, assigneeId: number | null, reporterId?: number | null) =>
    api.patch<WorkItemResponse>(`/work-items/${id}/assignee`, { assigneeId, reporterId }),
  updateMeasure: (id: number, body: { measureUnitId?: number | null; targetValue?: number | null; currentValue?: number | null }) =>
    api.patch<WorkItemResponse>(`/work-items/${id}/measure`, body),
  changeSprint: (id: number, sprintId: number | null) =>
    api.patch<WorkItemResponse>(`/work-items/${id}/sprint`, { sprintId }),
  createSubtask: (id: number, body: CreateSubtaskRequest) =>
    api.post<WorkItemResponse>(`/work-items/${id}/subtasks`, body),

  // 하위 작업(부모-자식 계층): BE search는 parentId 필터가 없으므로 프로젝트 항목을 받아
  //   클라에서 parentId===id로 거른다(신규 BE 없음 제약). 프로젝트 단위라 범위 한정.
  listByProject: (projectId: number) =>
    api.get<PageResponse<WorkItemResponse>>(`/work-items?projectId=${projectId}&size=200`),
  // Epic 하위 묶음 — epicId는 BE search 필터 지원.
  listByEpic: (epicId: number) =>
    api.get<PageResponse<WorkItemResponse>>(`/work-items?epicId=${epicId}&size=200`),

  listComments: (id: number) => api.get<Comment[]>(`/work-items/${id}/comments`),
  createComment: (id: number, body: CreateCommentRequest) =>
    api.post<Comment>(`/work-items/${id}/comments`, body),

  listLinks: (id: number) => api.get<LinkView[]>(`/work-items/${id}/links`),
  createLink: (id: number, body: CreateLinkRequest) =>
    api.post<LinkView[]>(`/work-items/${id}/links`, body),
  deleteLink: (id: number, linkId: number) =>
    api.delete<void>(`/work-items/${id}/links/${linkId}`),

  listAttachments: (id: number) => api.get<Attachment[]>(`/work-items/${id}/attachments`),
  createAttachment: (id: number, body: CreateAttachmentRequest) =>
    api.post<Attachment>(`/work-items/${id}/attachments`, body),

  convert: (id: number, body: ConvertRequest) =>
    api.patch<WorkItemResponse>(`/work-items/${id}/convert`, body),

  listActivities: (id: number) => api.get<Activity[]>(`/work-items/${id}/activities`),

  listApprovals: (id: number) => api.get<Approval[]>(`/work-items/${id}/approvals`),
  decideApproval: (approvalId: number, body: DecisionRequest) =>
    api.post<Approval>(`/approvals/${approvalId}/decision`, body),

  // 측정 단위 마스터(이름/접미사 표시용). /admin/measure-units는 OWNER/ADMIN 가드 —
  //   비권한 사용자는 403이 나므로 hooks에서 실패를 흡수(측정값만 표시).
  listMeasureUnits: () => api.get<PageResponse<MeasureUnit>>(`/admin/measure-units?size=100`),
};

export interface MeasureUnit {
  id: number;
  name: string;
  valueType: 'NUMBER' | 'BOOLEAN' | 'SELECT';
  suffix?: string | null;
  options?: string[] | null;
  isSystem: boolean;
  sortOrder: number;
}
