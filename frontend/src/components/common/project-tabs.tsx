// 프로젝트 본문 상단 가로 탭 (Jira식, T3-3 §9.1).
// LNB가 아니라 본문 상단에서 프로젝트 내부 뷰 전환. 유형 프리셋이 노출 조합을 정한다(§7).
// ds-ui Tabs(line variant) — 네이티브 위젯 금지 규칙 준수.
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@therecommerce/ds-ui';
import { ROUTES, type ProjectTab } from '@/lib/route-paths';
import { PROJECT_TAB_LABEL } from '@/types/domain';

export function ProjectTabs({ projectKey, tabs }: { projectKey: string; tabs: string[] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = tabs.find((t) => pathname.endsWith(`/${t}`)) ?? tabs[0];

  return (
    <Tabs
      value={current}
      onValueChange={(v) => navigate(ROUTES.project(projectKey, v as ProjectTab))}
      className="mb-4"
    >
      <TabsList variant="line">
        {tabs.map((t) => (
          <TabsTrigger key={t} value={t}>
            {PROJECT_TAB_LABEL[t] ?? t}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
