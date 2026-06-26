// 측정/진행률 바 (T3-3 ds-ui 매핑: MeasureBar — 단위·목표·현재). ds-ui Progress 미제공 → 토큰 바.
// 색 절제: 진행 신호만 primary 톤. 100% 도달 시에도 동일 톤(알록달록 금지).
interface Props {
  target?: number;
  current?: number;
  suffix?: string;
  unitName?: string;
}

export function MeasureBar({ target, current, suffix, unitName }: Props) {
  const hasTarget = target != null && target > 0;
  const pct = hasTarget ? Math.min(100, Math.round(((current ?? 0) / target) * 100)) : 0;
  const fmt = (n?: number) => (n != null ? `${n}${suffix ?? ''}` : '–');

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{unitName ?? '측정'}</span>
        <span className="font-medium text-foreground">
          {fmt(current)} {hasTarget && <span className="text-muted-foreground">/ {fmt(target)}</span>}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
