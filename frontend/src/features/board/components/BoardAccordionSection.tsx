// 보드 스프린트 섹션(CR-039, 병렬 스프린트 아코디언) — ACTIVE 스프린트 1개 = 접기/펼치기 섹션 1개.
// 헤더(스프린트명·기간·항목수) + 펼치면 그 스프린트 항목만 상태별 컬럼 칸반(독립 DnD).
// 운영형(sprintName=null)은 헤더 없이 KanbanBoard만(기존 단일 보드 UX 보존).
import { useState } from 'react';
import { ChevronRight, ChevronDown, CalendarRange } from 'lucide-react';
import type { BoardGroup } from '../api';
import { KanbanBoard } from './KanbanBoard';
import { fmtDate } from '@/lib/date';

interface Props {
  projectId: number;
  group: BoardGroup;
  assigneeName: (id?: number | null) => string | undefined;
  onCardClick?: (workItemId: number) => void;
}

export function BoardAccordionSection({ projectId, group, assigneeName, onCardClick }: Props) {
  const [collapsed, setCollapsed] = useState(false); // 기본 전부 펼침
  const cardCount = group.columns.reduce((n, c) => n + c.cards.length, 0);

  // 운영형/스크럼 미시작: 헤더 없이 칸반만(기존 단일 보드와 동일).
  if (group.sprintId == null) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <KanbanBoard projectId={projectId} columns={group.columns} assigneeName={assigneeName} onCardClick={onCardClick} />
      </div>
    );
  }

  const period =
    group.startDate || group.endDate ? `${fmtDate(group.startDate)} ~ ${fmtDate(group.endDate)}` : null;

  return (
    <div className="flex min-h-0 flex-col rounded-md border border-border">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 rounded-t-md bg-muted/60 px-3 py-2 text-left hover:bg-muted"
      >
        {collapsed ? (
          <ChevronRight className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{group.sprintName}</span>
        {period && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5" /> {period}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{cardCount}건</span>
      </button>

      {!collapsed && (
        // 병렬 섹션은 세로로 쌓이므로 각 섹션에 고정 높이(뷰포트 60vh)를 주고 그 안에서 칸반 자체 스크롤.
        // (단일 섹션은 BoardView가 bodyOwnsScroll 경로로 전체 화면을 채우므로 이 컴포넌트를 안 씀.)
        <div className="h-[60vh] min-h-0 p-2">
          <KanbanBoard projectId={projectId} columns={group.columns} assigneeName={assigneeName} onCardClick={onCardClick} />
        </div>
      )}
    </div>
  );
}
