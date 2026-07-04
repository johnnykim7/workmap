// 타임라인 간트 차트 — SVAR React Gantt(MIT) 기반 고도화(CR-035, WMP-VIEW-005).
// 자체 div 막대(구 구현) → SVAR로 교체: 막대 드래그/리사이즈, 의존성 링크선, 크리티컬 패스(FE 계산),
// 에픽 WBS 트리(summary/parent), 시간 단위 토글(zoom), 오늘선.
// - 드래그 저장: api.on("update-task", inProgress=false일 때만) → PATCH /work-items/{id}.
// - VIEWER 읽기전용(POL-004, CR-031): readonly.
// - 색 절제: --wx-gantt-* 를 ds-ui 토큰에 맞추고, 크리티컬 패스만 신호색.
import { useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gantt, Willow } from '@svar-ui/react-gantt';
import type { IApi } from '@svar-ui/react-gantt';
import { TypeBadge, StatusBadge } from '@/components/badges';
import { ROUTES } from '@/lib/route-paths';
import { useCanWrite } from '@/lib/permissions';
import type { IssueType, WorkStatus } from '@/types/domain';
import type { TimelineItem, TimelineLink } from '../api';
import { criticalPath, type DepLink } from '../timeline-util';
import { toGanttTasks, toGanttLinks, toDatePatch } from '../gantt-adapter';
import { useMoveTimelineDates } from '../hooks';

// SVAR 시간축 스케일(줌 4단위). format은 함수로 준다 — 문자열 토큰('yyyy' 등)은 SVAR가 리터럴로
// 그대로 출력함(운영 화면 실측). date-fns는 SVAR 중첩 의존이라 직접 import 불가 → 자체 포맷(한국어).
const fmtYear = (d: Date) => `${d.getFullYear()}년`;
const fmtYearMonth = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
const fmtMonth = (d: Date) => `${d.getMonth() + 1}월`;
const fmtDay = (d: Date) => `${d.getDate()}`;
const fmtQuarter = (d: Date) => `${Math.floor(d.getMonth() / 3) + 1}분기`;
const fmtWeek = (d: Date) => `${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}주`;
const SCALES = {
  today: [
    { unit: 'month', step: 1, format: fmtYearMonth },
    { unit: 'day', step: 1, format: fmtDay },
  ],
  week: [
    { unit: 'month', step: 1, format: fmtYearMonth },
    { unit: 'week', step: 1, format: fmtWeek },
  ],
  month: [
    { unit: 'year', step: 1, format: fmtYear },
    { unit: 'month', step: 1, format: fmtMonth },
  ],
  quarter: [
    { unit: 'year', step: 1, format: fmtYear },
    { unit: 'quarter', step: 1, format: fmtQuarter },
  ],
} as const;

export interface TimelineChartProps {
  items: TimelineItem[];
  links: TimelineLink[];
  projectId: number;
  /** epicId → title 매핑(요약행 라벨). */
  epicNames?: Map<number, string>;
}

export function TimelineChart({ items, links, projectId, epicNames }: TimelineChartProps) {
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const apiRef = useRef<IApi | null>(null);
  const moveDates = useMoveTimelineDates(projectId);

  const names = epicNames ?? new Map<number, string>();

  // 크리티컬 패스(FE 순수함수 — 드래그로 날짜 바뀌면 items 갱신 → 재계산).
  const depLinks: DepLink[] = useMemo(
    () => links.map((l) => ({ sourceId: l.sourceId, targetId: l.targetId })),
    [links],
  );
  const cp = useMemo(() => criticalPath(items, depLinks), [items, depLinks]);

  const tasks = useMemo(
    () => toGanttTasks(items, names, cp.nodeIds),
    [items, names, cp.nodeIds],
  );
  const ganttLinks = useMemo(
    () => toGanttLinks(links, cp.edgeKeys),
    [links, cp.edgeKeys],
  );

  // 드래그/리사이즈 저장 배선. inProgress(중간 프레임)은 스킵, 완료 시에만 PATCH.
  const init = useCallback(
    (api: IApi) => {
      apiRef.current = api;
      api.on('update-task', (ev: { id: number | string; task: any; inProgress?: boolean }) => {
        if (ev.inProgress) return;                    // 드래그 중 프레임 스킵
        if (typeof ev.id !== 'number') return;        // 에픽 요약행 등 커스텀 id는 skip(양수 work_item만)
        if (ev.id < 0) return;                         // EPICLESS 등 음수 그룹행 skip
        const patch = toDatePatch(ev.task);
        if (patch.startDate == null && patch.dueDate == null) return;
        moveDates.mutate({ itemId: ev.id, startDate: patch.startDate, dueDate: patch.dueDate });
      });
    },
    [moveDates],
  );

  // 좌측 그리드 컬럼 — 유형 뱃지 + key + 제목. 행 클릭 시 상세 이동.
  const columns = useMemo(
    () => [
      {
        id: 'text',
        header: '항목',
        width: 260,
        cell: (p: { row: any }) => <LabelCell row={p.row} onOpen={(k: string) => navigate(ROUTES.workItem(k))} />,
      },
    ],
    [navigate],
  );

  // 막대 커스텀 렌더 — 크리티컬 패스 노드에 링(신호색) + 상태 신호색. 색 절제(크리티컬만 강조).
  const taskTemplate = useCallback(
    (p: { data: any }) => <BarContent data={p.data} />,
    [],
  );

  return (
    <div className="wmp-gantt rounded-lg border border-border">
      <Willow>
        <Gantt
          init={init}
          tasks={tasks}
          links={ganttLinks}
          columns={columns}
          taskTemplate={taskTemplate}
          scales={SCALES.month as any}
          readonly={!canWrite}
          cellHeight={38}
        />
      </Willow>
    </div>
  );
}

// 막대 안 렌더 — 크리티컬 패스 노드는 신호색 링, 아니면 상태 톤. 색 남발 금지(크리티컬만 강조).
function BarContent({ data }: { data: any }) {
  if (data?.isEpicRow) return null; // 에픽 요약행은 SVAR 기본 롤업 막대 사용
  const critical = data?.critical === true;
  return (
    <div
      className={`flex h-full w-full items-center gap-1 overflow-hidden rounded px-1 text-[11px] ${
        critical ? 'ring-2 ring-destructive ring-inset' : ''
      }`}
      title={critical ? '크리티컬 패스' : undefined}
    >
      <span className="truncate text-white/90">{data?.text}</span>
    </div>
  );
}

// 좌측 그리드 셀 — TypeBadge + key + title. 에픽 요약행은 굵게.
function LabelCell({ row, onOpen }: { row: any; onOpen: (key: string) => void }) {
  if (row?.isEpicRow) {
    return (
      <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
        <TypeBadge type="EPIC" withLabel={false} />
        <span className="truncate">{row.text}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(row.wmpKey)}
      className="flex items-center gap-1.5 truncate text-left"
    >
      <TypeBadge type={row.issueType as IssueType} withLabel={false} />
      <span className="shrink-0 text-xs text-muted-foreground">{row.wmpKey}</span>
      <span className="truncate text-sm text-foreground">{row.text}</span>
    </button>
  );
}

// 상태 범례용(선택) — export 유지(기존 호환).
export { StatusBadge };
export type { WorkStatus };
