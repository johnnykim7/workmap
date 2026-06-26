// 번다운 차트 (WMP-AGL-006) — SVG 라인. 실제 잔여(actual) vs 이상선(ideal: total→0 직선).
// 차트 라이브러리 미사용(TimelineChart와 동일 — 자체 SVG). 색은 신호용 최소.
import type { BurndownResponse } from '../api';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

export function BurndownChart({ data }: { data: BurndownResponse }) {
  const pts = data.points;
  const total = Math.max(data.totalPoints, ...pts.map((p) => p.totalPoints), 1);
  const n = pts.length;

  if (n === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">아직 스냅샷이 없습니다.</p>;
  }

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // x: 인덱스 균등, y: 0~total 역방향(위=total).
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / total) * plotH;

  const actualPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.remainingPoints)}`).join(' ');
  // 이상선: 첫 점(total) → 마지막 점(0)
  const idealPath = `M ${x(0)} ${y(total)} L ${x(n - 1)} ${y(0)}`;

  // y축 눈금 0/half/total
  const yTicks = [0, Math.round(total / 2), total];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img" aria-label="번다운 차트">
        {/* y축 눈금/그리드 */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} className="stroke-border" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{t}</text>
          </g>
        ))}
        {/* 이상선(점선, 중립) */}
        <path d={idealPath} fill="none" className="stroke-muted-foreground" strokeWidth={1.5} strokeDasharray="4 4" />
        {/* 실제 잔여(파랑 신호) */}
        <path d={actualPath} fill="none" className="stroke-blue-500" strokeWidth={2} />
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.remainingPoints)} r={2.5} className="fill-blue-500" />
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-blue-500" /> 실제 잔여</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 border-t border-dashed border-muted-foreground" /> 이상선</span>
      </div>
    </div>
  );
}
