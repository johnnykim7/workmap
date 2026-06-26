// 회사 홈 (/) — 막힘 중심 대시보드(§9.2, WMP-HOME-001~002). Sprint5.
// 작은 조직은 진행률보다 "막힌 것"을 본다 → 막힘/지연/미배정을 상단에 크게. 집계는 전사(가시성 BIZ-108은 BE 처리).
import { Skeleton } from '@therecommerce/ds-ui';
import { Ban, Clock, UserX, Activity, CalendarCheck, CalendarRange } from 'lucide-react';
import { PageHead } from '@/components/badges';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import { DashboardListPanel } from '@/features/dashboard/components/DashboardListPanel';
import { useDashboardMetrics } from '@/features/dashboard/hooks';

export function HomePage() {
  const { data: m, isPending } = useDashboardMetrics();

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="회사 홈" desc="막힘·지연·미배정 중심 대시보드" />

      {/* 지표 카드(WMP-HOME-001) */}
      {isPending || !m ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="진행 중" value={m.inProgress} icon={<Activity className="size-3.5" />} />
          <MetricCard label="오늘 마감" value={m.dueToday} icon={<CalendarCheck className="size-3.5" />}
            tone={m.dueToday > 0 ? 'amber' : undefined} />
          <MetricCard label="이번 주 마감" value={m.dueThisWeek} icon={<CalendarRange className="size-3.5" />} />
          <MetricCard label="미배정" value={m.unassigned} icon={<UserX className="size-3.5" />}
            tone={m.unassigned > 0 ? 'amber' : undefined} />
          <MetricCard label="장기 미변경" value={m.stale} icon={<Clock className="size-3.5" />}
            tone={m.stale > 0 ? 'amber' : undefined} />
        </div>
      )}

      {/* 막힘/지연/미배정 패널(WMP-HOME-002) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardListPanel kind="blocked" title="막힌 업무" tone="red"
          icon={<Ban className="size-4 text-red-500" />} quickHref="/search?quick=blocked" />
        <DashboardListPanel kind="delayed" title="지연 업무" tone="amber"
          icon={<Clock className="size-4 text-amber-500" />} />
        <DashboardListPanel kind="unassigned" title="미배정 업무" tone="amber"
          icon={<UserX className="size-4 text-amber-500" />} quickHref="/search?quick=unassigned" />
      </div>
    </div>
  );
}
