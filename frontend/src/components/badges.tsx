// 공통 배지 — 업무 유형 / 상태 / 우선순위
import {
  WORK_STATUS_LABEL, STATUS_CATEGORY, ISSUE_TYPE_LABEL, ISSUE_TYPE_DESC, ISSUE_TYPE_COLOR,
  PRIORITY_LABEL, type WorkStatus, type IssueType, type Priority,
} from '@/types/domain';
import { Tooltip, TooltipTrigger, TooltipContent } from '@therecommerce/ds-ui';
import {
  Square, CheckSquare, Bug, Bookmark, Layers, GitBranch, FileText,
  ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown,
} from 'lucide-react';

// 배지 hover 힌트 — ds-ui Tooltip 래퍼(네이티브 title 금지, CLAUDE.md). title=강조 줄, desc=보조 설명.
// asChild로 자식 요소를 그대로 트리거로 사용(래핑 div 미추가).
function HintTip({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <span className="font-medium">{title}</span>
        {desc && <span className="block text-xs opacity-80">{desc}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

const CAT_LABEL: Record<string, string> = { TODO: '할 일', INPROGRESS: '진행 중', DONE: '완료' };

const TYPE_ICON: Record<IssueType, React.ReactNode> = {
  EPIC: <Layers className="size-3" />,
  STORY: <Bookmark className="size-3" />,
  TASK: <CheckSquare className="size-3" />,
  BUG: <Bug className="size-3" />,
  DOC: <FileText className="size-3" />,
  SUBTASK: <GitBranch className="size-3" />,
};
const TYPE_BG: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
};
// 아이콘 전용 색(배경 없이 아이콘 텍스트 색만) — Select 옵션 등 차분한 목록용.
const TYPE_ICON_COLOR: Record<string, string> = {
  violet: 'text-violet-600',
  green: 'text-green-600',
  blue: 'text-blue-600',
  red: 'text-red-600',
  amber: 'text-amber-600',
  slate: 'text-slate-500',
};

// 유형 아이콘(색) + 라벨 — Select 옵션/트리거용. 배경 배지 없이 차분하게(색 절제).
export function TypeOption({ type }: { type: IssueType }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={TYPE_ICON_COLOR[ISSUE_TYPE_COLOR[type]]}>{TYPE_ICON[type]}</span>
      {ISSUE_TYPE_LABEL[type]}
    </span>
  );
}

export function TypeBadge({ type, withLabel = true }: { type: IssueType; withLabel?: boolean }) {
  return (
    <HintTip title={ISSUE_TYPE_LABEL[type]} desc={ISSUE_TYPE_DESC[type]}>
      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_BG[ISSUE_TYPE_COLOR[type]]}`}>
        {TYPE_ICON[type]}
        {withLabel && ISSUE_TYPE_LABEL[type]}
      </span>
    </HintTip>
  );
}

// Epic 소속 칩(§6.1 백로그) — "이 항목이 어느 Epic 소속인지" 한 컬럼 표시(Jira식).
// Epic은 별도 계층이 아니라 느슨한 그룹핑(epicId)이라 트리가 아닌 칩으로 표현.
// color(CR-036): Epic별 고유 색(epicColor 해시 결과). 미지정 시 violet 단색(기존 동작).
export function EpicChip({ name, color = 'violet', onClick }: { name: string; color?: string; onClick?: () => void }) {
  const cls = `inline-flex max-w-[120px] items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_BG[color] ?? TYPE_BG.violet}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:brightness-95`} title={name}>
        <Layers className="size-3 shrink-0" />
        <span className="truncate">{name}</span>
      </button>
    );
  }
  return (
    <span className={cls} title={name}>
      <Layers className="size-3 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

const CAT_STYLE: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600',
  INPROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};
export function StatusBadge({ status }: { status: WorkStatus }) {
  const cat = STATUS_CATEGORY[status];
  const style = status === 'BLOCKED' ? 'bg-red-100 text-red-700' : CAT_STYLE[cat];
  const desc = status === 'BLOCKED' ? '차단 사유로 진행 막힘' : `${CAT_LABEL[cat]} 단계`;
  return (
    <HintTip title={WORK_STATUS_LABEL[status]} desc={desc}>
      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${style}`}>
        {WORK_STATUS_LABEL[status]}
      </span>
    </HintTip>
  );
}

const PRI_ICON: Record<Priority, React.ReactNode> = {
  HIGHEST: <ChevronsUp className="size-3.5 text-red-600" />,
  HIGH: <ChevronUp className="size-3.5 text-orange-500" />,
  MEDIUM: <Equal className="size-3.5 text-amber-500" />,
  LOW: <ChevronDown className="size-3.5 text-sky-500" />,
  LOWEST: <ChevronsDown className="size-3.5 text-slate-400" />,
};
export function PriorityBadge({ priority, withLabel = false }: { priority: Priority; withLabel?: boolean }) {
  return (
    <HintTip title={`우선순위: ${PRIORITY_LABEL[priority]}`}>
      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
        {PRI_ICON[priority]}
        {withLabel && PRIORITY_LABEL[priority]}
      </span>
    </HintTip>
  );
}

export function Avatar2({ name }: { name?: string }) {
  if (!name) {
    return (
      <HintTip title="담당자 없음">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">–</span>
      </HintTip>
    );
  }
  return (
    <HintTip title={name} desc="담당자">
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
        {name[0]}
      </span>
    </HintTip>
  );
}

// 페이지 헤더
// title은 GNB 헤더가 이미 화면명을 표시하므로 본문 h1로 중복 렌더하지 않는다(desc/actions만).
// prop은 호출부 호환을 위해 유지하되 렌더하지 않는다.
export function PageHead({ desc, actions }: { title?: string; desc?: string; actions?: React.ReactNode }) {
  if (!desc && !actions) return null;
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export { Square };
