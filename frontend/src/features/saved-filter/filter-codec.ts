// 저장 필터 query JSON 구조 (WMP-VIEW-004) — 검색 화면의 savable 상태.
// BE는 query를 임의 JSON 문자열로 패스스루하므로, 적용 시 방어적으로 파싱한다(잘못된 값 무시).
import type { IssueType, WorkStatus, Priority } from '@/types/domain';

export type QuickKey = 'mine' | 'recent' | 'blocked' | 'unassigned';

export interface SearchFilterState {
  keyword?: string;
  issueType?: IssueType;
  commonStatus?: WorkStatus;
  priority?: Priority;
  quick?: QuickKey[];
}
