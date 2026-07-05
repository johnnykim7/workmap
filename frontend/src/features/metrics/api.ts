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

// ── 2차: 흐름·예측 (WMP-HOME-006·007·008·010·014) ──────────────
export interface CycleTimePoint { id: number; key: string; firstDone: string; days: number; }
export interface CycleTime {
  sampleSize: number; p50Days: number; p85Days: number; points: CycleTimePoint[];
}
export interface StatusCount { commonStatus: string; count: number; }
export interface CfdDay { date: string; bands: StatusCount[]; }
export interface Cfd { from: string; to: string; days: CfdDay[]; }
export interface SayDoSprint {
  sprintId: number; sprintName: string;
  committedPoints: number; committedItems: number;
  donePoints: number; doneItems: number;
  sayDoPct: number; scopeChangePct: number;
}
export interface SayDo { sprints: SayDoSprint[]; }
export interface FieldVerification {
  total: number; passed: number; failed: number; partial: number; passRatePct: number;
}
export interface ForecastPoint { confidencePct: number; itemsByTarget: number; }
export interface Forecast {
  historyDays: number; avgThroughputPerDay: number; targetDays: number; distribution: ForecastPoint[];
}

// ── 3차: EVM·팀간대기·운영적용률 (WMP-HOME-010·012·013) ─────────
export interface Evm {
  configured: boolean; plannedPoints: number; earnedPoints: number;
  spi: number; cpi: number; note: string;
}
export interface TeamWaitItem {
  id: number; key: string; title: string; blockReason: string | null; waitDays: number;
}
export interface TeamWait { structured: boolean; waitingCount: number; items: TeamWaitItem[]; note: string; }
export interface OpsApply {
  tracked: boolean; devDoneCount: number; opsAppliedCount: number; applyRatePct: number; note: string;
}

export const metricsApi = {
  health: (projectId: number) => api.get<Health>(`/projects/${projectId}/health`),
  aging: (projectId: number) => api.get<Aging>(`/projects/${projectId}/metrics/aging`),
  rework: (projectId: number) => api.get<Rework>(`/projects/${projectId}/metrics/rework`),
  workload: (projectId: number) => api.get<Workload>(`/projects/${projectId}/metrics/workload`),
  // 2차
  cycleTime: (projectId: number) => api.get<CycleTime>(`/projects/${projectId}/metrics/cycle-time`),
  cfd: (projectId: number, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const s = q.toString();
    return api.get<Cfd>(`/projects/${projectId}/metrics/cfd${s ? `?${s}` : ''}`);
  },
  sayDo: (projectId: number) => api.get<SayDo>(`/projects/${projectId}/metrics/say-do`),
  fieldVerification: (projectId: number) => api.get<FieldVerification>(`/projects/${projectId}/metrics/field-verification`),
  forecast: (projectId: number, targetDays = 14) => api.get<Forecast>(`/projects/${projectId}/metrics/forecast?targetDays=${targetDays}`),
  // 3차
  evm: (projectId: number) => api.get<Evm>(`/projects/${projectId}/metrics/evm`),
  teamWait: (projectId: number) => api.get<TeamWait>(`/projects/${projectId}/metrics/team-wait`),
  opsApply: (projectId: number) => api.get<OpsApply>(`/projects/${projectId}/metrics/ops-apply`),
};
