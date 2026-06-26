// Sprint1 골격용 빈 상태 페이지 헬퍼.
// 데이터는 Sprint2~5 API 연동 시 채운다 — 지금은 모든 페이지가 EmptyState.
import type { ReactNode } from 'react';
import { Construction } from 'lucide-react';
import { PageHead } from './page-head';
import { EmptyState } from './empty-state';

export function StubPage({
  title,
  desc,
  sprint,
  icon,
  actions,
}: {
  title: string;
  desc?: string;
  sprint: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <>
      <PageHead title={title} desc={desc} actions={actions} />
      <EmptyState
        icon={icon ?? <Construction className="size-6" />}
        title="아직 준비 중입니다"
        description={`이 화면은 ${sprint}에서 구현됩니다. (Sprint1은 골격만)`}
      />
    </>
  );
}
