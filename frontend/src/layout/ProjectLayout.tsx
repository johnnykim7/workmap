// 프로젝트 본문 레이아웃 — 브레드크럼 + 제목 + 가로 탭(§9.1) + 탭 콘텐츠 Outlet.
// Sprint 2: 프로젝트를 API로 조회해 실제 이름/유형으로 탭 프리셋 결정.
import { Outlet, useParams } from 'react-router-dom';
import { ProjectTabs } from '@/components/common/project-tabs';
import { type ProjectTab } from '@/lib/route-paths';
import { PROJECT_TAB_PRESET, templateType } from '@/types/domain';
import { useProjectByKey } from '@/features/projects/hooks';

// 라우트/화면이 실제 존재하는 탭만(route-paths ProjectTab과 일치).
// active_tabs에 모르는 값이 섞여도 렌더/네비에서 걸러 튕김 방지(예: 과거 'issues' 유령 탭).
const KNOWN_TABS: ProjectTab[] = [
  'summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'attachments', 'approvals', 'reports',
];
const isKnownTab = (t: string): t is ProjectTab => (KNOWN_TABS as string[]).includes(t);

export function ProjectLayout() {
  const { key = '' } = useParams();
  const { data: project } = useProjectByKey(key);

  // 탭 조합: 프로젝트 설정에서 저장한 activeTabs 우선, 없으면 유형(templateId) 프리셋 폴백.
  // (#20 버그픽스: 설정에서 노출 탭을 바꿔 저장해도 화면이 프리셋만 봐서 반영 안 되던 문제)
  const rawTabs = project
    ? (project.activeTabs?.length ? project.activeTabs : PROJECT_TAB_PRESET[templateType(project.templateId)])
    : PROJECT_TAB_PRESET.DEV;
  // 알려진 탭만 노출 — 라우트 없는 값(유령 탭) 클릭 시 홈으로 튕기던 문제 방어.
  const tabs = rawTabs.filter(isKnownTab);

  // 브레드크럼·제목 줄 제거 — 프로젝트명은 글로벌 헤더 타이틀(HeaderTitle)로 이동(클릭=목록).
  // 높이 체인 연결: 부모(AppShell p-5, h-full)의 높이를 받아 세로 flex로 쪼갠다.
  //   - 탭 바 = shrink-0 (항상 고정, 스크롤 안 됨)
  //   - Outlet = flex-1 min-h-0 (각 View가 PageShell로 내부 스크롤 관리)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProjectTabs
        projectKey={key}
        tabs={tabs}
        projectId={project?.id}
        activeTabs={project?.activeTabs}
      />

      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
