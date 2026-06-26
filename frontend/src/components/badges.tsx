// 공통 배지 — 업무 유형 / 상태 / 우선순위
import {
  WORK_STATUS_LABEL, STATUS_CATEGORY, ISSUE_TYPE_LABEL, ISSUE_TYPE_COLOR,
  PRIORITY_LABEL, type WorkStatus, type IssueType, type Priority,
} from '@/types/domain';
import {
  Square, CheckSquare, Bug, Bookmark, Layers, GitBranch,
  ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown,
} from 'lucide-react';

const TYPE_ICON: Record<IssueType, React.ReactNode> = {
  EPIC: <Layers className="size-3" />,
  STORY: <Bookmark className="size-3" />,
  TASK: <CheckSquare className="size-3" />,
  BUG: <Bug className="size-3" />,
  SUBTASK: <GitBranch className="size-3" />,
};
const TYPE_BG: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function TypeBadge({ type, withLabel = true }: { type: IssueType; withLabel?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_BG[ISSUE_TYPE_COLOR[type]]}`}>
      {TYPE_ICON[type]}
      {withLabel && ISSUE_TYPE_LABEL[type]}
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
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {WORK_STATUS_LABEL[status]}
    </span>
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
    <span className="inline-flex items-center gap-1 text-xs text-slate-600" title={PRIORITY_LABEL[priority]}>
      {PRI_ICON[priority]}
      {withLabel && PRIORITY_LABEL[priority]}
    </span>
  );
}

export function Avatar2({ name }: { name?: string }) {
  if (!name) return <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">–</span>;
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700" title={name}>
      {name[0]}
    </span>
  );
}

// 페이지 헤더
export function PageHead({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export { Square };
