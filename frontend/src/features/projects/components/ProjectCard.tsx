// 프로젝트 카드 — 이름·키·유형·상태. 본문 클릭 → 프로젝트 요약(T3-3 §프로젝트 목록).
// 우상단 메뉴(Manager 이상)로 설정(수정/보관/가시성, WMP-WS-004/006) 진입.
// 지연/막힘/진행률은 work_item 집계 전까지 목록 응답에 없으므로 요약 화면에서 노출.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Settings } from 'lucide-react';
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@therecommerce/ds-ui';
import type { Project } from '@/types/domain';
import { PROJECT_STATUS_LABEL, templateType } from '@/types/domain';
import { ROUTES } from '@/lib/route-paths';
import { useAuthStore } from '@/store/auth-store';
import { ProjectTypeBadge } from './ProjectTypeBadge';
import { ProjectSettingsDialog } from './ProjectSettingsDialog';

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canManage = role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER';

  return (
    <div className="relative rounded-lg border border-border bg-background transition-colors hover:border-primary/40 hover:bg-muted/30">
      {canManage && (
        <div className="absolute right-2 top-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label="프로젝트 메뉴">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" /> 설정
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(ROUTES.project(project.key))}
        className="flex w-full flex-col p-4 text-left"
      >
        <div className="mb-2 flex items-start justify-between gap-2 pr-8">
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

      {canManage && (
        <ProjectSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} project={project} />
      )}
    </div>
  );
}
