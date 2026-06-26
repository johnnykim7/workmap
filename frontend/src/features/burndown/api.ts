// 번다운/벨로시티 API (WMP-AGL-006, CR-012) — 조회 전용. BurndownController 계약 기준.
// 번다운=스프린트별(잔여/누적완료 포인트 추이), 벨로시티=프로젝트별(완료 스프린트 완료포인트 + 평균).
import { api } from '@/lib/api-client';

export interface BurndownPoint {
  date: string;            // LocalDate
  remainingPoints: number;
  completedPoints: number;
  totalPoints: number;
  snapshotType: string;
}
export interface BurndownResponse {
  sprintId: number;
  totalPoints: number;
  points: BurndownPoint[];
}

export interface VelocityItem {
  sprintId: number;
  completedDate: string;
  completedPoints: number;
}
export interface VelocityResponse {
  projectId: number;
  sprints: VelocityItem[];
  averageVelocity: number;
}

export const burndownApi = {
  burndown: (sprintId: number) => api.get<BurndownResponse>(`/sprints/${sprintId}/burndown`),
  velocity: (projectId: number) => api.get<VelocityResponse>(`/projects/${projectId}/velocity`),
};
