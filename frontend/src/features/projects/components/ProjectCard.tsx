// 프로젝트 카드 — 이름·키·유형·상태. 클릭 → 프로젝트 요약(T3-3 §프로젝트 목록).
// 지연/막힘/진행률은 work_item 집계(Sprint3) 전까지 목록 응답에 없으므로 요약 화면에서 노출.
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types/domain';
import { PROJECT_STATUS_LABEL, templateType } from '@/types/domain';
import { ROUTES } from '@/lib/route-paths';
import { ProjectTypeBadge } from './ProjectTypeBadge';

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.project(project.key))}
      className="flex flex-col rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{project.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{project.key}</div>
        </div>
        <ProjectTypeBadge type={templateType(project.templateId)} />
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="rounded bg-muted px-1.5 py-0.5 text-foreground">
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
        {project.visibility === 'PRIVATE' && (
          <span className="text-muted-foreground">비공개</span>
        )}
      </div>
    </button>
  );
}
