// 타임라인 차트 — start~due 막대 로드맵(T3-3 타임라인 §). 한 항목 = 한 행.
// 좌측 고정 라벨(TypeBadge+key+title) + 우측 트랙(시간축 막대). 막대 색은 상태 신호용.
import { useNavigate } from 'react-router-dom';
import { TypeBadge, StatusBadge } from '@/components/badges';
import { ROUTES } from '@/lib/route-paths';
import { STATUS_CATEGORY } from '@/types/domain';
import type { TimelineItem } from '../api';
import { computeSpan, barMetrics, monthTicks, sortByStart } from '../timeline-util';

// 막대 채움 색(상태 신호용, 중립 기반 — 색 남발 금지).
const BAR_TONE: Record<string, string> = {
  TODO: 'bg-slate-300',
  INPROGRESS: 'bg-blue-400',
  DONE: 'bg-green-400',
};
function barColor(status: TimelineItem['commonStatus']): string {
  if (status === 'BLOCKED') return 'bg-red-400';
  return BAR_TONE[STATUS_CATEGORY[status]] ?? 'bg-slate-300';
}

const LABEL_W = 'w-64';

export function TimelineChart({ items }: { items: TimelineItem[] }) {
  const navigate = useNavigate();
  const span = computeSpan(items);
  if (!span) return null; // 빈 상태는 상위(페이지)에서 EmptyState로 처리
  const sorted = sortByStart(items);
  const ticks = monthTicks(span);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      {/* 시간축 헤더 */}
      <div className="flex border-b border-border bg-muted/40">
        <div className={`${LABEL_W} shrink-0 border-r border-border px-3 py-2 text-xs font-medium text-muted-foreground`}>
          항목
        </div>
        <div className="relative h-8 flex-1">
          {ticks.map((t, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-border/60 pl-1 text-[11px] text-muted-foreground"
              style={{ left: `${t.left}%` }}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* 행 */}
      {sorted.map((it) => {
        const m = barMetrics(it, span);
        return (
          <div key={it.id} className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/30">
            <button
              type="button"
              onClick={() => navigate(ROUTES.workItem(it.key))}
              className={`${LABEL_W} flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-2 text-left`}
            >
              <TypeBadge type={it.issueType} withLabel={false} />
              <span className="shrink-0 text-xs text-muted-foreground">{it.key}</span>
              <span className="truncate text-sm text-foreground">{it.title}</span>
            </button>
            <div className="relative h-9 flex-1">
              {m && (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.workItem(it.key))}
                  title={`${it.startDate ?? '?'} ~ ${it.dueDate ?? '?'} · ${it.progress}%`}
                  className={`absolute top-1.5 h-6 overflow-hidden rounded ${barColor(it.commonStatus)}`}
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  {/* 진행률 채움(더 진한 톤) */}
                  <span
                    className="absolute inset-y-0 left-0 bg-black/15"
                    style={{ width: `${it.progress}%` }}
                  />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 상세 진입 없이 상태만 보여주는 범례용(선택) — 현재 페이지에서 미사용이나 export 유지.
export { StatusBadge };
