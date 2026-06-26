// 스프린트 헤더(§6.1) — 이름·기간·항목수·상태별 카운트·추정합 + 접기 + 시작/완료 액션.
// FUTURE: [스프린트 시작](앞 스프린트 ACTIVE면 비활성). ACTIVE: [스프린트 완료]. COMPLETED: 비활성.
import type { BacklogSection } from '../api';
import type { Sprint } from '@/types/domain';
import { SPRINT_STATUS_LABEL, STATUS_CATEGORY } from '@/types/domain';
import { Button, Badge } from '@therecommerce/ds-ui';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  section: BacklogSection;       // sprint != null
  collapsed: boolean;
  onToggle: () => void;
  startDisabled?: boolean;       // 앞 스프린트가 ACTIVE면 시작 비활성
  onStart: (sprint: Sprint) => void;
  onComplete: (sprint: Sprint) => void;
  busy?: boolean;
}

function period(s: Sprint): string | null {
  if (!s.startDate && !s.endDate) return null;
  const fmt = (d?: string | null) => (d ? d.slice(5).replace('-', '/') : '…');
  return `${fmt(s.startDate)} – ${fmt(s.endDate)}`;
}

export function SprintHeader({ section, collapsed, onToggle, startDisabled, onStart, onComplete, busy }: Props) {
  const sprint = section.sprint!;
  const counts = { todo: 0, inprogress: 0, done: 0 };
  section.items.forEach((i) => {
    const cat = STATUS_CATEGORY[i.commonStatus];
    if (cat === 'TODO') counts.todo++;
    else if (cat === 'INPROGRESS') counts.inprogress++;
    else counts.done++;
  });
  const range = period(sprint);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-t-md bg-muted/60 px-3 py-2">
      <button onClick={onToggle} className="flex items-center gap-1 text-sm font-medium text-foreground">
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
        {sprint.name}
      </button>
      {range && <span className="text-xs text-muted-foreground">{range}</span>}
      <Badge variant={sprint.status === 'ACTIVE' ? 'default' : 'secondary'}>
        {SPRINT_STATUS_LABEL[sprint.status]}
      </Badge>

      {/* 상태별 카운트 — 회색 토큰. 색 신호는 칸반에서. */}
      <span className="ml-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CountChip label="할일" n={counts.todo} />
        <CountChip label="진행" n={counts.inprogress} />
        <CountChip label="완료" n={counts.done} />
      </span>

      <span className="text-xs text-muted-foreground">
        {section.itemCount}건{section.storyPointsSum > 0 ? ` · ${section.storyPointsSum}pt` : ''}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {sprint.status === 'FUTURE' && (
          <Button
            size="sm"
            variant="primary"
            disabled={busy || startDisabled || section.itemCount === 0}
            title={startDisabled ? '진행 중인 스프린트를 먼저 완료하세요' : section.itemCount === 0 ? '항목이 없습니다' : undefined}
            onClick={() => onStart(sprint)}
          >
            스프린트 시작
          </Button>
        )}
        {sprint.status === 'ACTIVE' && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => onComplete(sprint)}>
            스프린트 완료
          </Button>
        )}
      </div>
    </div>
  );
}

function CountChip({ label, n }: { label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-background text-[10px] font-medium text-foreground">
        {n}
      </span>
      {label}
    </span>
  );
}
