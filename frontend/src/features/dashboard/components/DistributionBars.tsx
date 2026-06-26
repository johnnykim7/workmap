// 분포 위젯(WMP-HOME-003) — 상태별/유형별/담당자별 막대. 신호색 남발 금지: 중립 막대 한 가지.
// key→라벨 변환은 호출부에서 labelOf로 주입(상태/유형/담당자 각각 다름).
import type { Distribution } from '../api';

export function DistributionBars({
  title,
  items,
  labelOf,
  emptyText = '데이터 없음',
}: {
  title: string;
  items: Distribution[];
  labelOf?: (key: string) => string;
  emptyText?: string;
}) {
  const max = items.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => {
            const pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
            return (
              <li key={d.key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-foreground" title={labelOf?.(d.key) ?? d.key}>
                  {labelOf?.(d.key) ?? d.key}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{d.count}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
