// 프로젝트 본문 레이아웃 — 브레드크럼 + 제목 + 가로 탭(§9.1) + 탭 콘텐츠 Outlet.
// Sprint 2: 프로젝트를 API로 조회해 실제 이름/유형으로 탭 프리셋 결정.
import { Outlet, useParams, Link } from 'react-router-dom';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
  Skeleton,
} from '@therecommerce/ds-ui';
import { ProjectTabs } from '@/components/common/project-tabs';
import { ROUTES } from '@/lib/route-paths';
import { PROJECT_TAB_PRESET, templateType } from '@/types/domain';
import { useProjectByKey } from '@/features/projects/hooks';

export function ProjectLayout() {
  const { key = '' } = useParams();
  const { data: project, isPending } = useProjectByKey(key);

  // 유형(templateId) 프리셋으로 탭 조합 결정(Phase1 고정). 로딩 중엔 DEV 프리셋 임시.
  const tabs = project ? PROJECT_TAB_PRESET[templateType(project.templateId)] : PROJECT_TAB_PRESET.DEV;
  const title = project?.name ?? key;

  return (
    <div>
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={ROUTES.projects}>프로젝트</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{key}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isPending ? (
        <Skeleton className="mb-3 h-7 w-48" />
      ) : (
        <h1 className="mb-3 text-xl font-semibold text-foreground">{title}</h1>
      )}
      <ProjectTabs projectKey={key} tabs={tabs} />

      <Outlet />
    </div>
  );
}
