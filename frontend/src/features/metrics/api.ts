// 프로젝트 건강 지표 API (CR-043, WMP-HOME-004~011) — BE MetricsController 계약 기준.
// 전부 프로젝트 단건. 막힘=flagged(CR-040). 예외기반 지표는 비어있으면 건강.
import { api } from '@/lib/api-client';

// ── 종합 건강 판정 (WMP-HOME-004) ─────────────────────────────
export type AxisStatus = 'OK' | 'WARN' | 'CRIT';

export interface AxisHealth {
  axis: string;      // FLOW | QUALITY | TEAM | ...
  label: string;     // 흐름 / 품질 / 팀 부하
  status: AxisStatus;
  summary: string;
}

export interface Health {
  projectId: number;
  projectName: string;
  score: number;     // 0~100
  verdict: string;   // 대체로 순조로움 / 주의 필요 / 위험
  axes: AxisHealth[];
}

// ── Work Item Age (WMP-HOME-005) ──────────────────────────────
export interface AgingItem {
  id: number;
  key: string;
  title: string;
  commonStatus: string;
  flagged: boolean;
  blockReason: string | null;
  assigneeId: number | null;
  ageDays: number;
}
export interface Aging {
  sleDays: number;
  blockedCount: number;
  overSleCount: number;
  items: AgingItem[];
}

// ── 재작업 (WMP-HOME-009) ─────────────────────────────────────
export interface ReopenItem {
  id: number;
  key: string;
  title: string;
  reopenCount: number;
  assigneeId: number | null;
}
export interface Rework {
  everDoneCount: number;
  reopenedCount: number;
  reopenRatePct: number;
  items: ReopenItem[];
}

// ── 담당자 과부하 (WMP-HOME-011) ──────────────────────────────
export interface WorkloadRow {
  assigneeId: number | null;
  inProgress: number;
  delayed: number;
  blocked: number;
}
export interface Workload {
  rows: WorkloadRow[];
}

export const metricsApi = {
  health: (projectId: number) => api.get<Health>(`/projects/${projectId}/health`),
  aging: (projectId: number) => api.get<Aging>(`/projects/${projectId}/metrics/aging`),
  rework: (projectId: number) => api.get<Rework>(`/projects/${projectId}/metrics/rework`),
  workload: (projectId: number) => api.get<Workload>(`/projects/${projectId}/metrics/workload`),
};
