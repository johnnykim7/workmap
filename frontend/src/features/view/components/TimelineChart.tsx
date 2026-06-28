// 타임라인 차트 — 에픽 WBS 그룹 + start~due 막대 로드맵(T3-3 타임라인 §).
// CR-021: 시간 단위 토글(월/주). CR-023: 에픽=상위 그룹(WBS 펼침 트리) + 에픽 다중선택 필터
//   + 4단위 토글(오늘/주/개월/분기, "구간 한정 + 줌") + 오늘 세로선.
// 좌측 고정 라벨(TypeBadge+key+title) + 우측 트랙(시간축 막대). 막대 색은 상태 신호용.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Popover, PopoverContent, PopoverTrigger } from '@therecommerce/ds-ui';
import { ChevronDown, ChevronRight, ListFilter } from 'lucide-react';
import { TypeBadge, StatusBadge } from '@/components/badges';
import { ROUTES } from '@/lib/route-paths';
import { STATUS_CATEGORY } from '@/types/domain';
import type { TimelineItem } from '../api';
import {
  barMetrics, ticksFor, spanFor, todayMarker, groupByEpic, rollupMetrics,
  type TimeScale, type EpicGroup,
} from '../timeline-util';

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

const LABEL_W = 'w-72';
const SCALES: { key: TimeScale; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '주' },
  { key: 'month', label: '개월' },
  { key: 'quarter', label: '분기' },
];

const NO_EPIC = -1;

export interface TimelineChartProps {
  items: TimelineItem[];
  /** epicId → title (issueType=EPIC 조회 결과 매핑). 없으면 "에픽 #id"로 폴백. */
  epicNames?: Map<number, string>;
}

export function TimelineChart({ items, epicNames }: TimelineChartProps) {
  const navigate = useNavigate();
  const [scale, setScale] = useState<TimeScale>('month');
  // 에픽 필터: 선택된 epicId 집합(빈 집합 = 전체 표시). NO_EPIC(-1) = "(에픽 없음)" 그룹.
  const [selectedEpics, setSelectedEpics] = useState<Set<number>>(new Set());
  // 펼침 상태: 접힌 epicId 집합(기본 전부 펼침).
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const names = epicNames ?? new Map<number, string>();
  const groups = useMemo(() => groupByEpic(items, names), [items, names]);

  // 구간 한정 + 줌: 단위별 오늘 기준 창. 차트에서만 현재 시각 주입(순수 함수 spanFor).
  const today = Date.now();
  const span = useMemo(() => spanFor(scale, today), [scale, today]);
  const ticks = ticksFor(scale, span);
  const todayLeft = todayMarker(span, today);

  // 필터 적용(클라이언트). 빈 선택 = 전부.
  const visibleGroups = selectedEpics.size === 0
    ? groups
    : groups.filter((g) => selectedEpics.has(g.epicId));

  function toggleEpic(epicId: number) {
    setSelectedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  }
  function toggleCollapse(epicId: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  }

  return (
    <div className="rounded-lg border border-border">
      {/* 상단 바: 에픽 필터(좌) */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ListFilter className="size-4" />
              에픽
              {selectedEpics.size > 0 && (
                <span className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">{selectedEpics.size}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60 p-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-medium text-muted-foreground">에픽으로 보기</span>
              {selectedEpics.size > 0 && (
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedEpics(new Set())}
                >
                  전체 해제
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {groups.length === 0 && (
                <div className="px-1 py-2 text-xs text-muted-foreground">에픽이 없습니다</div>
              )}
              {groups.map((g) => (
                <label
                  key={g.epicId}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedEpics.has(g.epicId)}
                    onCheckedChange={() => toggleEpic(g.epicId)}
                  />
                  <span className="truncate">{g.name}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{g.children.length}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
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
            {todayLeft != null && (
              <div
                className="absolute top-0 z-10 h-full border-l-2 border-blue-500"
                style={{ left: `${todayLeft}%` }}
                title="오늘"
              />
            )}
          </div>
        </div>

        {/* 에픽 그룹(WBS) — 그룹 헤더 행 + 펼침 시 하위 항목 행 */}
        {visibleGroups.map((g) => (
          <EpicGroupRows
            key={g.epicId}
            group={g}
            span={span}
            todayLeft={todayLeft}
            collapsed={collapsed.has(g.epicId)}
            onToggleCollapse={() => toggleCollapse(g.epicId)}
            onNavigate={(key) => navigate(ROUTES.workItem(key))}
          />
        ))}
      </div>

      {/* 하단 바: 시간 단위 토글(오늘/주/개월/분기, CR-023) — Jira 우하단 위치 */}
      <div className="flex items-center justify-end gap-1 border-t border-border px-3 py-1.5">
        {SCALES.map((s) => (
          <Button
            key={s.key}
            variant={scale === s.key ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setScale(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// 한 에픽 그룹 = 헤더 행(롤업 막대) + (펼침 시) 하위 항목 행들.
function EpicGroupRows({
  group, span, todayLeft, collapsed, onToggleCollapse, onNavigate,
}: {
  group: EpicGroup;
  span: ReturnType<typeof spanFor>;
  todayLeft: number | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (key: string) => void;
}) {
  const rollup = group.rollup ? rollupMetrics(group.rollup, span) : null;
  return (
    <>
      {/* 그룹 헤더 행 */}
      <div className="flex items-center border-b border-border bg-muted/20 hover:bg-muted/40">
        <div className={`${LABEL_W} flex shrink-0 items-center gap-1.5 border-r border-border px-2 py-2`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted"
            aria-label={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {!group.isNoEpic && <TypeBadge type="EPIC" withLabel={false} />}
          <span className="truncate text-sm font-medium text-foreground">{group.name}</span>
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{group.children.length}</span>
        </div>
        <div className="relative h-9 flex-1">
          {todayLeft != null && (
            <div className="absolute top-0 z-0 h-full border-l border-blue-500/40" style={{ left: `${todayLeft}%` }} />
          )}
          {rollup && (
            <div
              className="absolute top-2.5 h-4 rounded bg-violet-300/70 ring-1 ring-violet-400/60"
              style={{ left: `${rollup.left}%`, width: `${rollup.width}%` }}
              title={`에픽 롤업 · ${group.children.length}건`}
            />
          )}
        </div>
      </div>

      {/* 하위 항목 행(펼침 시) */}
      {!collapsed && group.children.map((it) => {
        const m = barMetrics(it, span);
        return (
          <div key={it.id} className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/30">
            <button
              type="button"
              onClick={() => onNavigate(it.key)}
              className={`${LABEL_W} flex shrink-0 items-center gap-1.5 border-r border-border py-2 pr-3 pl-9 text-left`}
            >
              <TypeBadge type={it.issueType} withLabel={false} />
              <span className="shrink-0 text-xs text-muted-foreground">{it.key}</span>
              <span className="truncate text-sm text-foreground">{it.title}</span>
            </button>
            <div className="relative h-9 flex-1">
              {todayLeft != null && (
                <div className="absolute top-0 z-0 h-full border-l border-blue-500/40" style={{ left: `${todayLeft}%` }} />
              )}
              {m && (
                <button
                  type="button"
                  onClick={() => onNavigate(it.key)}
                  title={`${it.startDate ?? '?'} ~ ${it.dueDate ?? '?'} · ${it.progress}%`}
                  className={`absolute top-1.5 z-[1] h-6 overflow-hidden rounded ${barColor(it.commonStatus)}`}
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  {/* 진행률 채움(더 진한 톤) */}
                  <span className="absolute inset-y-0 left-0 bg-black/15" style={{ width: `${it.progress}%` }} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

// 상세 진입 없이 상태만 보여주는 범례용(선택) — 현재 페이지에서 미사용이나 export 유지.
export { StatusBadge };
