// 벨로시티 차트 (WMP-AGL-006) — 완료 스프린트별 완료포인트 막대 + 평균선. CSS 막대(차트 라이브러리 미사용).
import type { VelocityResponse } from '../api';

export function VelocityChart({ data, sprintName }: {
  data: VelocityResponse;
  sprintName?: (sprintId: number) => string | undefined;
}) {
  const items = data.sprints;
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">완료된 스프린트가 없습니다.</p>;
  }
  const max = Math.max(...items.map((s) => s.completedPoints), 1);

  return (
    <div>
      <div className="mb-2 text-sm text-muted-foreground">
        평균 벨로시티 <span className="font-semibold text-foreground">{data.averageVelocity.toFixed(1)}</span> 포인트
      </div>
      <div className="flex items-end gap-3 overflow-x-auto pb-1" style={{ height: 160 }}>
        {items.map((s) => {
          const h = Math.round((s.completedPoints / max) * 130);
          return (
            <div key={s.sprintId} className="flex w-16 shrink-0 flex-col items-center justify-end gap-1">
              <span className="text-xs font-medium tabular-nums text-foreground">{s.completedPoints}</span>
              <div className="w-8 rounded-t bg-primary/70" style={{ height: Math.max(h, 4) }} />
              <span className="w-full truncate text-center text-[10px] text-muted-foreground" title={sprintName?.(s.sprintId)}>
                {sprintName?.(s.sprintId) ?? `#${s.sprintId}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
