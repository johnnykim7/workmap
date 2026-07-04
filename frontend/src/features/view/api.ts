// 보기(타임라인/캘린더) API (T3-2 §F, WMP-VIEW-002/003) — 실 BE 계약(ViewDtos) 기준.
// GET /projects/{id}/timeline, GET /projects/{id}/calendar?year=&month=.
// 항목은 work_item 파생 뷰(BIZ-106) — 별도 테이블 없음.
import { api } from '@/lib/api-client';
import type { IssueType, WorkStatus, Priority } from '@/types/domain';

// BE ViewDtos.TimelineItem — 타임라인/캘린더 공통 항목.
export interface TimelineItem {
  id: number;
  key: string;
  title: string;
  issueType: IssueType;
  commonStatus: WorkStatus;
  priority: Priority;
  assigneeId: number | null;
  epicId: number | null;
  startDate: string | null; // ISO yyyy-MM-dd
  dueDate: string | null;
  progress: number; // 0~100
}

// BE ViewDtos.TimelineLink — 의존성 링크(WMP-VIEW-006, CR-035). 간트 화살표용(선행→후행).
// BLOCKS 방향만 병기(양방향 저장이라 BLOCKED_BY 짝은 생략).
export interface TimelineLink {
  sourceId: number;
  targetId: number;
  linkType: string; // 현재 BLOCKS만
}

// BE ViewDtos.TimelineResponse. CR-035로 links[] 병기.
export interface TimelineResponse {
  projectId: number;
  items: TimelineItem[];
  links: TimelineLink[];
}

// BE ViewDtos.CalendarDay / CalendarResponse.
export interface CalendarDay {
  date: string; // ISO yyyy-MM-dd
  items: TimelineItem[];
}
export interface CalendarResponse {
  projectId: number;
  year: number;
  month: number;
  days: CalendarDay[];
}

export const viewApi = {
  timeline: (projectId: number) =>
    api.get<TimelineResponse>(`/projects/${projectId}/timeline`),
  // year/month 미지정 시 BE가 현재 월로 처리.
  calendar: (projectId: number, year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year != null) q.set('year', String(year));
    if (month != null) q.set('month', String(month));
    const qs = q.toString();
    return api.get<CalendarResponse>(`/projects/${projectId}/calendar${qs ? `?${qs}` : ''}`);
  },
};
