// 흐름·예측·일정 지표 카드 (CR-043, 2·3차) — Cycle Time·CFD·Say-Do·Forecast·현장검증·EVM·팀간대기.
// 흐름기반(F)은 추세·형태로 판단. 차트는 의존성 0 자체 SVG. 데이터 미설정 지표는 정직하게 안내.
import { Skeleton } from '@therecommerce/ds-ui';
import { Gauge, Activity, Target, ShieldCheck, TrendingUp, Layers, Hourglass } from 'lucide-react';
import {
  useCycleTime, useCfd, useSayDo, useFieldVerification, useForecast,
  useEvm, useTeamWait,
} from '../hooks';
import type { CfdDay } from '../api';

const STATUS_COLOR: Record<string, string> = {
  TODO: '#8b939c', IN_PROGRESS: '#0d7d7d', IN_REVIEW: '#6a4bc4',
  DONE: '#2f8f4e', HOLD: '#b5820a', BLOCKED: '#c23b3b',
};

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">{icon}{title}</h3>
      {children}
    </div>
  );
}

// CFD 자체 SVG(누적 밴드) — 밴드가 평행하면 건강.
function CfdChart({ days }: { days: CfdDay[] }) {
  if (days.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">스냅샷 데이터가 아직 없습니다(일배치 적재 후).</p>;
  const W = 320, H = 120, pad = 4;
  const statuses = Array.from(new Set(days.flatMap((d) => d.bands.map((b) => b.commonStatus))));
  const totals = days.map((d) => d.bands.reduce((s, b) => s + b.count, 0));
  const maxTotal = Math.max(...totals, 1);
  const x = (i: number) => pad + (i / Math.max(days.length - 1, 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - (v / maxTotal) * (H - 2 * pad);
  // 누적 밴드: 상태 순서대로 아래에서 쌓음.
  const bandPaths = statuses.map((st, si) => {
    const upper = days.map((d, i) => {
      let acc = 0;
      for (let k = 0; k <= si; k++) acc += d.bands.find((b) => b.commonStatus === statuses[k])?.count ?? 0;
      return { i, v: acc };
    });
    const lower = days.map((d, i) => {
      let acc = 0;
      for (let k = 0; k < si; k++) acc += d.bands.find((b) => b.commonStatus === statuses[k])?.count ?? 0;
      return { i, v: acc };
    });
    const up = upper.map((p) => `${x(p.i)},${y(p.v)}`).join(' ');
    const down = lower.reverse().map((p) => `${x(p.i)},${y(p.v)}`).join(' ');
    return <polygon key={st} points={`${up} ${down}`} fill={STATUS_COLOR[st] ?? '#8b939c'} opacity="0.75" />;
  });
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>{bandPaths}</svg>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {statuses.map((st) => (
          <span key={st} className="inline-flex items-center gap-1">
            <i className="size-2 rounded-sm" style={{ background: STATUS_COLOR[st] ?? '#8b939c' }} />{st}
          </span>
        ))}
      </div>
    </>
  );
}

export function FlowMetricsSection({ projectId }: { projectId?: number }) {
  const { data: cycle, isPending: cp } = useCycleTime(projectId);
  const { data: cfd, isPending: fp } = useCfd(projectId);
  const { data: sayDo } = useSayDo(projectId);
  const { data: fv } = useFieldVerification(projectId);
  const { data: forecast } = useForecast(projectId);
  const { data: evm } = useEvm(projectId);
  const { data: teamWait } = useTeamWait(projectId);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-muted-foreground">흐름 · 예측 · 일정 (2·3차)</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Cycle Time */}
        <Card title="Cycle Time (85%p SLE)" icon={<Gauge className="size-4" />}>
          {cp ? <Skeleton className="h-24 w-full rounded" /> : cycle && cycle.sampleSize > 0 ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold tabular-nums text-primary">{cycle.p85Days}일</span>
                <span className="text-xs text-muted-foreground">85%가 이 일수 내 완료 · 중앙값 {cycle.p50Days}일 · 표본 {cycle.sampleSize}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">평균 아님, 백분위 — 짧을수록 건강.</p>
            </>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">완료 이력이 아직 부족합니다.</p>}
        </Card>

        {/* CFD */}
        <Card title="CFD 누적 흐름도" icon={<Layers className="size-4" />}>
          {fp ? <Skeleton className="h-32 w-full rounded" /> : cfd ? <CfdChart days={cfd.days} /> : null}
        </Card>

        {/* Say-Do */}
        <Card title="Say-Do Ratio (약속 이행)" icon={<Target className="size-4" />}>
          {sayDo && sayDo.sprints.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {sayDo.sprints.slice(0, 5).map((s) => {
                const healthy = s.sayDoPct >= 80 && s.sayDoPct <= 110;
                return (
                  <li key={s.sprintId} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="truncate text-muted-foreground">{s.sprintName}</span>
                    <span className={`shrink-0 font-semibold tabular-nums ${healthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {s.sayDoPct}% <span className="text-xs text-muted-foreground">({s.donePoints}/{s.committedPoints}p)</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">동결된 스프린트 커밋이 아직 없습니다(스프린트 시작 후).</p>}
        </Card>

        {/* 현장 검증 */}
        <Card title="현장 검증률" icon={<ShieldCheck className="size-4" />}>
          {fv && fv.total > 0 ? (
            <div className="flex items-center gap-4">
              <span className={`text-2xl font-extrabold tabular-nums ${fv.passRatePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{fv.passRatePct}%</span>
              <div className="text-xs text-muted-foreground">
                <div>통과 {fv.passed} · 실패 {fv.failed} · 부분 {fv.partial}</div>
                <div>전체 {fv.total}건</div>
              </div>
            </div>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">현장 검증 기록이 아직 없습니다.</p>}
        </Card>

        {/* Monte Carlo */}
        <Card title="완료 예측 (Monte Carlo)" icon={<TrendingUp className="size-4" />}>
          {forecast ? (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                최근 {forecast.historyDays}일 처리량 {forecast.avgThroughputPerDay}/일 기준 · {forecast.targetDays}일 내
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {forecast.distribution.map((d) => (
                  <li key={d.confidencePct} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{d.confidencePct}% 확률</span>
                    <span className="font-semibold tabular-nums">{d.itemsByTarget}건 이상</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <Skeleton className="h-24 w-full rounded" />}
        </Card>

        {/* EVM */}
        <Card title="획득가치 SPI/CPI (EVM)" icon={<Activity className="size-4" />}>
          {evm ? evm.configured ? (
            <div className="flex gap-6">
              <div>
                <span className={`text-2xl font-extrabold tabular-nums ${evm.spi >= 1 ? 'text-emerald-600' : 'text-amber-600'}`}>{evm.spi}</span>
                <div className="text-xs text-muted-foreground">SPI (일정, EV {evm.earnedPoints}/{evm.plannedPoints}p)</div>
              </div>
              <div className="text-xs text-muted-foreground self-end">{evm.note}</div>
            </div>
          ) : <p className="py-4 text-center text-sm text-muted-foreground">{evm.note}</p> : <Skeleton className="h-20 w-full rounded" />}
        </Card>
      </div>

      {/* 팀 간 대기 (전폭) */}
      <Card title="팀 간 대기 (막힘 항목)" icon={<Hourglass className="size-4" />}>
        {teamWait && teamWait.items.length > 0 ? (
          <>
            {!teamWait.structured && (
              <p className="mb-2 text-xs text-muted-foreground">{teamWait.note}</p>
            )}
            <ul className="flex flex-col divide-y divide-border">
              {teamWait.items.slice(0, 8).map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-mono text-xs text-primary">{it.key}</span>{' '}
                    <span className="text-muted-foreground">{it.blockReason ?? it.title}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-amber-600">{it.waitDays}일 대기</span>
                </li>
              ))}
            </ul>
          </>
        ) : <p className="py-4 text-center text-sm text-muted-foreground">대기 중인 막힘 항목이 없습니다.</p>}
      </Card>
    </div>
  );
}
