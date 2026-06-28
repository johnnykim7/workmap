// 캘린더 그리드 — 월별 7열 달력(T3-3 캘린더 §). due_date 기준 항목 배치.
// 상단 바: 이전/다음 달 네비 + 오늘. 날짜 칸: 숫자 + 항목 칩(+N건 더보기). 칩 클릭 → 상세.
// CR-021: 빈칸 클릭 → 그 날짜 마감일 프리필 생성 모달, 칩 드래그&드롭 → 마감일 변경.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@therecommerce/ds-ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TypeBadge } from '@/components/badges';
import { ROUTES } from '@/lib/route-paths';
import type { CalendarResponse } from '../api';
import { buildCalendarCells, shiftMonth, WEEKDAYS } from '../calendar-util';

const MAX_CHIPS = 3;

interface Props {
  year: number;
  month: number;
  data?: CalendarResponse;
  today?: string; // yyyy-MM-dd (오늘 강조)
  onChangeMonth: (year: number, month: number) => void;
  onToday: () => void;
  // CR-021 — 빈칸 클릭(그 날짜 마감일로 업무 생성) / 칩 드롭(마감일 변경). 미전달 시 인터랙션 비활성(읽기 전용).
  onCreateOnDate?: (date: string) => void;
  onMoveItem?: (itemId: number, toDate: string) => void;
}

export function CalendarGrid({ year, month, data, today, onChangeMonth, onToday, onCreateOnDate, onMoveItem }: Props) {
  const navigate = useNavigate();
  const cells = buildCalendarCells(year, month, data?.days ?? []);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border">
      {/* 상단 바 */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="이전 달"
            onClick={() => { const p = shiftMonth(year, month, -1); onChangeMonth(p.year, p.month); }}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-28 text-center text-sm font-semibold text-foreground">
            {year}년 {month}월
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="다음 달"
            onClick={() => { const n = shiftMonth(year, month, 1); onChangeMonth(n.year, n.month); }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onToday}>오늘</Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`px-2 py-1.5 text-center text-xs font-medium ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 칸 */}
      <div className="grid grid-cols-7">
        {cells.map((c) => {
          const isToday = today != null && c.date === today;
          const extra = c.items.length - MAX_CHIPS;
          const isDropTarget = overDate === c.date && dragId != null;
          return (
            <div
              key={c.date}
              className={`group relative min-h-24 border-b border-r border-border p-1.5 last:border-r-0 ${
                c.inMonth ? 'bg-background' : 'bg-muted/20'
              } ${isDropTarget ? 'ring-2 ring-inset ring-primary/60' : ''}`}
              // 빈 영역(칩 아님) 클릭 → 그 날짜 마감일로 생성. 드래그 드롭 대상.
              onClick={(e) => {
                if (!onCreateOnDate) return;
                if (e.target !== e.currentTarget) return; // 칩/숫자 클릭은 제외(빈 영역만)
                onCreateOnDate(c.date);
              }}
              onDragOver={onMoveItem ? (e) => { e.preventDefault(); setOverDate(c.date); } : undefined}
              onDrop={onMoveItem ? (e) => {
                e.preventDefault();
                setOverDate(null);
                if (dragId != null) onMoveItem(dragId, c.date);
                setDragId(null);
              } : undefined}
            >
              <div
                className={`pointer-events-none mb-1 inline-flex size-5 items-center justify-center rounded-full text-xs ${
                  isToday ? 'bg-primary font-semibold text-primary-foreground' : c.inMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {c.day}
              </div>
              <div className="flex flex-col gap-0.5">
                {c.items.slice(0, MAX_CHIPS).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    draggable={!!onMoveItem}
                    onDragStart={onMoveItem ? () => setDragId(it.id) : undefined}
                    onDragEnd={onMoveItem ? () => { setDragId(null); setOverDate(null); } : undefined}
                    onClick={() => navigate(ROUTES.workItem(it.key))}
                    title={`${it.key} ${it.title}`}
                    className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-muted ${
                      onMoveItem ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${dragId === it.id ? 'opacity-40' : ''}`}
                  >
                    <TypeBadge type={it.issueType} withLabel={false} />
                    <span className="truncate text-foreground">{it.title}</span>
                  </button>
                ))}
                {extra > 0 && (
                  <span className="pointer-events-none px-1 text-[11px] text-muted-foreground">+{extra}건</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
