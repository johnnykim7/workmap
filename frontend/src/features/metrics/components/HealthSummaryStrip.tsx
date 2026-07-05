// 종합 건강 판정 스트립 (CR-043 배치) — 보고서 [건강]탭 상단 + 프로젝트 요약 공용.
// 스코어 링 + verdict + 5축 axes 칩. 색은 심각도 신호(정상/주의/위험)에만 절제 사용.
// 요약 화면은 신호만 노출하고 축 칩 클릭 시 보고서로 위임(onAxisClick 주입).
import type { AxisStatus, Health } from '../api';

// 심각도 → Tailwind 토큰(테마 대응). accent와 분리된 의미색만.
export const AXIS_TONE: Record<AxisStatus, { text: string; bg: string; dot: string }> = {
  OK: { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', dot: 'bg-emerald-500' },
  WARN: { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', dot: 'bg-amber-500' },
  CRIT: { text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/40', dot: 'bg-red-500' },
};

export function ScoreRing({ score }: { score: number }) {
  const tone = score >= 85 ? 'OK' : score >= 60 ? 'WARN' : 'CRIT';
  const color = tone === 'OK' ? '#2f8f4e' : tone === 'WARN' ? '#b5820a' : '#c23b3b';
  return (
    <div
      className="relative grid size-24 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${score}%, var(--muted, #eef1f3) ${score}% 100%)` }}
    >
      <div className="absolute inset-[9px] rounded-full bg-background" />
      <span className="relative text-2xl font-extrabold tracking-tight tabular-nums">
        {score}
        <span className="text-xs font-semibold text-muted-foreground">/100</span>
      </span>
    </div>
  );
}

/**
 * 종합 건강 판정 스트립.
 * - `subtitle`: 링 옆 보조 문구. 미지정 시 "N개 축 평가" 기본.
 * - `onAxisClick`: 지정 시 축 칩이 버튼이 되어 클릭 가능(요약→보고서 위임). 미지정 시 정적 span(보고서 현행).
 */
export function HealthSummaryStrip({
  health,
  subtitle,
  onAxisClick,
}: {
  health: Health;
  subtitle?: string;
  onAxisClick?: (axis: string) => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-5 rounded-xl border border-border bg-card p-5">
      <ScoreRing score={health.score} />
      <div>
        <h2 className="text-base font-bold">{health.verdict}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {subtitle ?? `${health.axes.length}개 축 평가 · 이상 축만 아래에서 확인`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {health.axes.map((a) => {
            const tone = AXIS_TONE[a.status];
            const cls = `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${tone.bg} ${tone.text}`;
            const inner = (
              <>
                <span className={`size-2 rounded-full ${tone.dot}`} />
                {a.label}
              </>
            );
            return onAxisClick ? (
              <button
                key={a.axis}
                type="button"
                className={`${cls} transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                title={`${a.summary} · 클릭하면 보고서에서 자세히`}
                onClick={() => onAxisClick(a.axis)}
              >
                {inner}
              </button>
            ) : (
              <span key={a.axis} className={cls} title={a.summary}>
                {inner}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
