// 프로젝트 본문 레이아웃 — 브레드크럼 + 제목 + 가로 탭(§9.1) + 탭 콘텐츠 Outlet.
// Sprint 2: 프로젝트를 API로 조회해 실제 이름/유형으로 탭 프리셋 결정.
import { Outlet, useParams, Link } from 'react-router-dom';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
  Skeleton,
} from '@therecommerce/ds-ui';
import { ProjectTabs } from '@/components/common/project-tabs';
import { ROUTES, type ProjectTab } from '@/lib/route-paths';
import { PROJECT_TAB_PRESET, templateType } from '@/types/domain';
import { useProjectByKey } from '@/features/projects/hooks';

// 라우트/화면이 실제 존재하는 탭만(route-paths ProjectTab과 일치).
// active_tabs에 모르는 값이 섞여도 렌더/네비에서 걸러 튕김 방지(예: 과거 'issues' 유령 탭).
const KNOWN_TABS: ProjectTab[] = [
  'summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'approvals', 'reports',
];
const isKnownTab = (t: string): t is ProjectTab => (KNOWN_TABS as string[]).includes(t);

export function ProjectLayout() {
  const { key = '' } = useParams();
  const { data: project, isPending } = useProjectByKey(key);

  // 탭 조합: 프로젝트 설정에서 저장한 activeTabs 우선, 없으면 유형(templateId) 프리셋 폴백.
  // (#20 버그픽스: 설정에서 노출 탭을 바꿔 저장해도 화면이 프리셋만 봐서 반영 안 되던 문제)
  const rawTabs = project
    ? (project.activeTabs?.length ? project.activeTabs : PROJECT_TAB_PRESET[templateType(project.templateId)])
    : PROJECT_TAB_PRESET.DEV;
  // 알려진 탭만 노출 — 라우트 없는 값(유령 탭) 클릭 시 홈으로 튕기던 문제 방어.
  const tabs = rawTabs.filter(isKnownTab);
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
