// WorkMap 도메인 타입 — v0.4 (Jira 애자일 기반, CR-006)
// 핵심 컨셉: 하나의 work_item 데이터, 여러 관점 (이슈·리스크·WBS·칸반·타임라인은 파생 뷰).
// 계층: 워크스페이스 > 프로젝트 > work_item(Epic > Story/Task/Bug > Sub-task)

// ───────────────────────── 상태 (Workflow / FSM) ─────────────────────────
// 상태 전이는 BE FSM 화이트리스트만(BIZ-010). 유형별 워크플로는 BE workflow 시드 참조.
export type WorkStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE'
  | 'RECEIVED'
  | 'CHECKING'
  | 'PROCESSING'
  | 'FIELD_CHECK'
  | 'HOLD'
  | 'DEV_DONE'
  | 'FIELD_VERIFY'
  | 'OPS_APPLIED'
  | 'BLOCKED';

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  IN_REVIEW: '검토 중',
  DONE: '완료',
  RECEIVED: '접수',
  CHECKING: '확인 중',
  PROCESSING: '처리 중',
  FIELD_CHECK: '현장확인',
  HOLD: '보류',
  DEV_DONE: '개발완료',
  FIELD_VERIFY: '현장검증중',
  OPS_APPLIED: '운영반영완료',
  BLOCKED: '막힘',
};

// 상태 카테고리 (Jira: To Do / In Progress / Done) — 색/집계용
export type StatusCategory = 'TODO' | 'INPROGRESS' | 'DONE';
export const STATUS_CATEGORY: Record<WorkStatus, StatusCategory> = {
  TODO: 'TODO',
  RECEIVED: 'TODO',
  IN_PROGRESS: 'INPROGRESS',
  IN_REVIEW: 'INPROGRESS',
  CHECKING: 'INPROGRESS',
  PROCESSING: 'INPROGRESS',
  FIELD_CHECK: 'INPROGRESS',
  DEV_DONE: 'INPROGRESS',
  FIELD_VERIFY: 'INPROGRESS',
  HOLD: 'INPROGRESS',
  BLOCKED: 'INPROGRESS',
  DONE: 'DONE',
  OPS_APPLIED: 'DONE',
};

// ───────────────────────── 업무 유형 (IssueType / 계층) ─────────────────────────
export type IssueType = 'EPIC' | 'STORY' | 'TASK' | 'BUG' | 'DOC' | 'SUBTASK';

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  EPIC: 'Epic',
  STORY: 'Story',
  TASK: 'Task',
  BUG: 'Bug',
  DOC: 'Doc',
  SUBTASK: 'Sub-task',
};

export const ISSUE_TYPE_COLOR: Record<IssueType, 'violet' | 'green' | 'blue' | 'red' | 'amber' | 'slate'> = {
  EPIC: 'violet',
  STORY: 'green',
  TASK: 'blue',
  BUG: 'red',
  DOC: 'amber',
  SUBTASK: 'slate',
};

// ───────────────────────── 우선순위 ─────────────────────────
export type Priority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST';
export const PRIORITY_LABEL: Record<Priority, string> = {
  HIGHEST: '최우선',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
  LOWEST: '최하',
};

// ───────────────────────── 프로젝트 유형 (T3-3 §7 — 유형 프리셋) ─────────────────────────
// 개발형 / 운영형 / 계획형 / 기본형. 유형이 기본 탭 조합과 워크플로를 정한다.
export type ProjectType = 'DEV' | 'OPS' | 'PLAN' | 'DEFAULT';
export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  DEV: '개발형',
  OPS: '운영형',
  PLAN: '계획형',
  DEFAULT: '기본형',
};

// 유형별 본문 가로 탭 프리셋 (T3-3 §9.1). 값은 route-paths.ts ProjectTab 키와 일치.
// BE 시드 project_template.default_tabs와 일치(CR-019 정합 — BE가 정본).
export const PROJECT_TAB_PRESET: Record<ProjectType, string[]> = {
  DEV: ['summary', 'backlog', 'board', 'timeline', 'reports'],
  OPS: ['summary', 'board', 'list', 'calendar', 'approvals', 'reports'],
  PLAN: ['summary', 'timeline', 'reports'],
  // 기본형(Jira "빈 스페이스") — 8탭 전부, 생성 후 불필요 탭은 끔.
  DEFAULT: ['summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'approvals', 'reports'],
};

export const PROJECT_TAB_LABEL: Record<string, string> = {
  summary: '요약',
  list: '목록',
  board: '보드',
  backlog: '백로그',
  timeline: '타임라인',
  calendar: '캘린더',
  approvals: '승인',
  reports: '보고서',
};

// ───────────────────────── 핵심 엔티티 ─────────────────────────
export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

// BE UserResponse: { id, email, name, role:String, departmentId, active, createdAt }
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: number;
  active: boolean;
}

export interface Workspace {
  id: number;
  name: string;
  description?: string; // BE Response 포함(WMP-WS-001 생성/수정에서 편집)
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'DONE' | 'ARCHIVED';
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: '준비',
  ACTIVE: '진행',
  DONE: '완료',
  ARCHIVED: '보관',
};

export type Visibility = 'PUBLIC' | 'PRIVATE';
export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PUBLIC: '공개',
  PRIVATE: '비공개',
};

// BE ProjectDtos.Response 그대로 (T3-2 §D). 유형은 templateId로 표현(BIZ-107, enum 아님).
// progress/itemCount/지연·막힘 등 표시용 집계는 BE 미제공 → /summary 또는 work_item(Sprint3)에서.
export interface Project {
  id: number;
  workspaceId: number;
  key: string; // Jira식 프로젝트 키 (URL /projects/:key)
  name: string;
  templateId: number;
  status: ProjectStatus;
  visibility: Visibility;
  workflowId?: number;
  activeTabs?: string[];
  startDate?: string;
  endDate?: string;
  description?: string;
  createdBy?: number;
  archivedAt?: string;
  createdAt?: string;
}

// 프로젝트 멤버 (BE MemberDtos.Response: userId, name, email, role:String, createdAt)
export interface ProjectMember {
  userId: number;
  name: string;
  email: string;
  role: UserRole; // 프로젝트 내 역할(POL-004)
  createdAt?: string;
}

// 프로젝트 템플릿 (유형 마스터, BIZ-107). BE에 조회 엔드포인트가 없어 FE 상수로 보유.
// id는 V2 시드 INSERT 순서(GENERATED ALWAYS): DEV=1, OPS=2, PLAN=3.
export interface ProjectTemplate {
  id: number;
  code: ProjectType;
  name: string;
  description: string;
  defaultTabs: string[];
  issueTypeCodes: string[];
}

// 주의: id는 BE 시드 순서가 아니라 자체 매핑값. 실제 생성은 templateId(아래 id)를 BE로 전달.
// BE 시드 default_tabs/issue_type_codes와 일치(CR-019 정합 — BE가 정본).
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // issueTypeCodes는 BE project_template.issue_type_codes(V7 DOC 편입 포함)와 일치시킨다.
  { id: 4, code: 'DEFAULT', name: '기본형', description: '모든 보기를 켠 범용 프로젝트(필요 없는 탭은 생성 후 끄기)', defaultTabs: ['summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'approvals', 'reports'], issueTypeCodes: ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK', 'DOC'] },
  { id: 1, code: 'DEV', name: '개발형', description: '개발 프로젝트(백로그·스프린트·보드 중심)', defaultTabs: ['summary', 'backlog', 'board', 'timeline', 'reports'], issueTypeCodes: ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK', 'DOC'] },
  { id: 2, code: 'OPS', name: '운영형', description: '운영·고객대응(접수·처리·보류 워크플로)', defaultTabs: ['summary', 'board', 'list', 'calendar', 'approvals', 'reports'], issueTypeCodes: ['TASK', 'BUG', 'SUBTASK'] },
  { id: 3, code: 'PLAN', name: '계획형', description: '계획·경영공통(타임라인·목록 중심)', defaultTabs: ['summary', 'timeline', 'reports'], issueTypeCodes: ['EPIC', 'STORY', 'TASK', 'DOC'] },
];

/** templateId → 프로젝트 유형(탭 프리셋·배지용). 미지정/미상은 DEV로 폴백. */
export function templateType(templateId?: number): ProjectType {
  return PROJECT_TEMPLATES.find((t) => t.id === templateId)?.code ?? 'DEV';
}

// 프로젝트 요약 카드 (GET /projects/:id/summary)
export interface ProjectSummary {
  total: number;
  done: number;
  delayed: number;
  blocked: number;
  progress: number;
}

// BE WorkItemDtos.Response 그대로 (T3-2 §F). 보드/백로그 카드·통합목록이 받는 실 계약.
// 주의: 아래 WorkItem(목 도메인)과 달리 assigneeId/statusId 기반(이름·키 비정규화 없음).
// 담당자 이름은 멤버 목록에서 assigneeId로 해소한다.
export interface WorkItemResponse {
  id: number;
  key: string;
  projectId: number;
  issueType: IssueType;
  parentId?: number | null;
  epicId?: number | null;
  title: string;
  description?: string | null;
  workflowId?: number | null;
  statusId?: number | null;
  commonStatus: WorkStatus;
  priority: Priority;
  assigneeId?: number | null;
  reporterId?: number | null;
  sprintId?: number | null;
  storyPoints?: number | null;
  estimateHours?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  progress: number;
  blockReason?: string | null;
  measureUnitId?: number | null;
  targetValue?: number | null;
  currentValue?: number | null;
  // 유형별 본문 필드(§9.3 — BE Response 전체 계약). 보드/백로그 카드 목록엔 비어 올 수 있음.
  acceptanceCriteria?: string[] | null; // Story 인수조건
  stepsToReproduce?: string[] | null; // Bug 재현절차
  expectedResult?: string | null; // Bug 기대 결과
  actualResult?: string | null; // Bug 실제 결과
  environment?: string | null; // Bug 환경
  severity?: string | null; // Bug 심각도
  checklist?: string | null; // Task 작업 체크리스트(개행 구분 텍스트)
  relatedSolutions?: string[] | null;
  labels?: string[] | null;
  completedAt?: string | null;
  createdBy?: number | null;
  createdAt?: string | null;
}

// ───────────────────────── 업무 상세 하위 리소스 (§9.3) ─────────────────────────
// BE SubResourceDtos / LinkDtos / ApprovalDtos 그대로.
export interface Comment {
  id: number;
  workItemId: number;
  authorId: number;
  content: string;
  mentionedUserIds?: number[] | null;
  createdAt: string;
}

export type LinkType = 'BLOCKS' | 'BLOCKED_BY' | 'RELATES_TO' | 'DUPLICATES';
export const LINK_TYPE_LABEL: Record<LinkType, string> = {
  BLOCKS: '막는 항목',
  BLOCKED_BY: '막힌 원인',
  RELATES_TO: '관련 항목',
  DUPLICATES: '중복',
};

// BE LinkDtos.LinkView — 링크 메타 + 연결 항목(target) 요약.
export interface LinkView {
  linkId: number;
  linkType: LinkType;
  targetId: number;
  targetKey: string;
  targetTitle: string;
  targetIssueType: IssueType;
  targetCommonStatus: WorkStatus;
}

// BE SubResourceDtos.ActivityResponse — 활동 이력 한 행.
export interface Activity {
  id: number;
  workItemId: number;
  actorId: number;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
}

// BE ApprovalDtos.Response — 승인 게이트 1건.
// 요청 시 decision='APPROVE'|'REJECT'. 저장 상태는 decision 컬럼(NOT NULL DEFAULT 'PENDING').
export type ApprovalDecision = 'APPROVE' | 'REJECT';
export type ApprovalState = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface Approval {
  id: number;
  workItemId: number;
  statusId?: number | null;
  requestedBy?: number | null;
  approverId?: number | null;
  approverRole?: string | null;
  decision: ApprovalState; // BE: NOT NULL, 미결정은 'PENDING'(null 아님)
  comment?: string | null;
  decidedBy?: number | null;
  decidedAt?: string | null;
  createdAt: string;
}

// 기한 경과(미완료) 판정 — BE는 isDelayed를 안 주므로 클라에서 계산.
export function isWorkItemDelayed(w: Pick<WorkItemResponse, 'dueDate' | 'commonStatus'>): boolean {
  if (!w.dueDate) return false;
  if (w.commonStatus === 'DONE' || w.commonStatus === 'OPS_APPLIED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(w.dueDate) < today;
}

// work_item — Epic/Story/Task/Bug/Sub-task 통합 단일 엔티티 (BIZ-014/015)
export interface WorkItem {
  id: number;
  key: string; // 예: WMP-101
  title: string;
  issueType: IssueType;
  status: WorkStatus;
  priority: Priority;
  projectKey: string;
  assigneeName?: string;
  assigneeId?: number;
  epicKey?: string;
  parentKey?: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  isDelayed?: boolean;
  blockReason?: string;
  description?: string;
}

// ───────────────────────── 스프린트 (애자일, WMP-AGL) ─────────────────────────
// BE SprintDtos.Response 그대로. status FSM: FUTURE→ACTIVE→COMPLETED (T1-5).
export type SprintStatus = 'FUTURE' | 'ACTIVE' | 'COMPLETED';
export const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  FUTURE: '예정',
  ACTIVE: '진행 중',
  COMPLETED: '완료',
};

export interface Sprint {
  id: number;
  projectId: number;
  name: string;
  goal?: string | null;
  status: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
}
