// 프로젝트 건강 대시보드 (CR-043, WMP-HOME-004~011) — 보고서 [건강] 서브탭.
// 종합 판정 링 + 5축 신호등 + 예외축 3카드(Age·재작업·과부하). 예외기반은 비면 긍정 EmptyState.
// 색은 심각도 신호(정상/주의/위험)에만 절제 사용. 막힘=flagged(CR-040).
import { Skeleton } from '@therecommerce/ds-ui';
import { Ban, RefreshCw, Users, CheckCircle2, Clock } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { useAssigneeName } from '@/features/members/use-assignee-name';
import {
  useHealth, useAging, useRework, useWorkload,
} from '../hooks';
import type { AxisStatus } from '../api';
import { FlowMetricsSection } from './FlowMetricsSection';
import { HealthSummaryStrip, AXIS_TONE as TONE } from './HealthSummaryStrip';

export function HealthDashboard({ projectId }: { projectId?: number }) {
  const { data: health, isPending: hp } = useHealth(projectId);
  const { data: aging, isPending: ap } = useAging(projectId);
  const { data: rework, isPending: rp } = useRework(projectId);
  const { data: workload, isPending: wp } = useWorkload(projectId);
  const assigneeName = useAssigneeName(projectId);

  const nameOf = (id: number | null) =>
    id == null ? '미배정' : assigneeName(id) ?? `사용자 #${id}`;

  if (hp || !health) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 종합 건강 판정 (공통 스트립 — 보고서·요약 공용, CR-043 배치) */}
      <HealthSummaryStrip health={health} />

      {/* 예외축 3카드 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* A. Work Item Age */}
        <MetricPanel
          title="멈춘 일 (Age)"
          icon={<Clock className="size-4" />}
          loading={ap}
          empty={!!aging && aging.blockedCount === 0 && aging.overSleCount === 0}
          emptyText="멈춘 일 없음 — 순조롭게 진행 중"
        >
          {aging && (
            <>
              <div className="mb-2 flex gap-4 text-xs">
                <Stat label="막힘" value={aging.blockedCount} tone={aging.blockedCount > 0 ? 'CRIT' : 'OK'} />
                <Stat label={`SLE ${aging.sleDays}일 초과`} value={aging.overSleCount} tone={aging.overSleCount > 0 ? 'WARN' : 'OK'} />
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {aging.items.slice(0, 6).map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-mono text-xs text-primary">{it.key}</span>{' '}
                      <span className="text-muted-foreground">{it.title}</span>
                    </span>
                    <span className={`shrink-0 tabular-nums font-semibold ${it.flagged ? 'text-red-600' : it.ageDays >= aging.sleDays ? 'text-amber-600' : ''}`}>
                      {it.flagged ? <Ban className="mr-1 inline size-3" /> : null}{it.ageDays}일
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </MetricPanel>

        {/* D. 재작업률 */}
        <MetricPanel
          title="재작업률 (Reopen)"
          icon={<RefreshCw className="size-4" />}
          loading={rp}
          empty={!!rework && rework.reopenedCount === 0}
          emptyText="재작업 없음 — 한 번에 완료됨"
        >
          {rework && (
            <>
              <div className="mb-2">
                <span className={`text-2xl font-extrabold tabular-nums ${rework.reopenRatePct >= 10 ? 'text-red-600' : rework.reopenRatePct > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {rework.reopenRatePct}%
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({rework.reopenedCount}/{rework.everDoneCount} · 기준 10%)
                </span>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {rework.items.slice(0, 6).map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-mono text-xs text-primary">{it.key}</span>{' '}
                      <span className="text-muted-foreground">{it.title}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-amber-600">재오픈 {it.reopenCount}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </MetricPanel>

        {/* E. 담당자 과부하 */}
        <MetricPanel
          title="담당자 과부하"
          icon={<Users className="size-4" />}
          loading={wp}
          empty={!!workload && workload.rows.every((r) => r.delayed === 0 && r.blocked === 0)}
          emptyText="부하 균형 — 몰린 사람 없음"
        >
          {workload && (
            <ul className="flex flex-col gap-2">
              {workload.rows.slice(0, 6).map((r) => {
                const risky = r.blocked > 0 && r.delayed > 0;
                const warn = r.delayed > 0 || r.blocked > 0;
                const total = Math.max(r.inProgress, 1);
                return (
                  <li key={r.assigneeId ?? 'none'} className="text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate font-medium">{nameOf(r.assigneeId)}</span>
                      <span className={`text-xs font-semibold ${risky ? 'text-red-600' : warn ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {risky ? `위험 지연${r.delayed}·막힘${r.blocked}` : warn ? `주의 지연${r.delayed}·막힘${r.blocked}` : `정상 ${r.inProgress}건`}
                      </span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                      <span className="bg-primary" style={{ width: `${((r.inProgress - r.delayed - r.blocked) / total) * 100}%` }} />
                      <span className="bg-amber-500" style={{ width: `${(r.delayed / total) * 100}%` }} />
                      <span className="bg-red-500" style={{ width: `${(r.blocked / total) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </MetricPanel>
      </div>

      {/* 2·3차 흐름·예측·일정 지표 */}
      <FlowMetricsSection projectId={projectId} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: AxisStatus }) {
  return (
    <span className="flex flex-col">
      <span className={`text-lg font-bold tabular-nums ${TONE[tone].text}`}>{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </span>
  );
}

function MetricPanel({
  title, icon, loading, empty, emptyText, children,
}: {
  title: string; icon: React.ReactNode; loading: boolean;
  empty: boolean; emptyText: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">{icon}{title}</h3>
      {loading ? (
        <Skeleton className="h-40 w-full rounded" />
      ) : empty ? (
        <EmptyState icon={<CheckCircle2 className="size-6 text-emerald-500" />} title={emptyText} />
      ) : (
        children
      )}
    </div>
  );
}
