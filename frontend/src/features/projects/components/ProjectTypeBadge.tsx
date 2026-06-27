// 프로젝트 유형 배지 — 신호용 최소 색(CLAUDE.md 색 절제). DEV/OPS/PLAN/DEFAULT.
import { PROJECT_TYPE_LABEL, type ProjectType } from '@/types/domain';

const STYLE: Record<ProjectType, string> = {
  DEV: 'bg-blue-100 text-blue-700',
  OPS: 'bg-amber-100 text-amber-700',
  PLAN: 'bg-slate-100 text-slate-600',
  DEFAULT: 'bg-slate-100 text-slate-600',
};

export function ProjectTypeBadge({ type }: { type: ProjectType }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${STYLE[type]}`}>
      {PROJECT_TYPE_LABEL[type]}
    </span>
  );
}
