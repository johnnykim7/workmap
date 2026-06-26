// 지표 카드 한 칸(WMP-HOME-001) — SummaryView Metric 톤 일치.
// 색은 신호용으로만 최소(미배정/장기미변경 등 주의 지표만 amber). 본문은 중립 톤.
import type { ReactNode } from 'react';

export function MetricCard({
  label, value, tone, icon,
}: {
  label: string;
  value: number | string;
  tone?: 'amber' | 'red';
  icon?: ReactNode;
}) {
  const color = tone === 'amber' ? 'text-amber-600' : tone === 'red' ? 'text-red-600' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
