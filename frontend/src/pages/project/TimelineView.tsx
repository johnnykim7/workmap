// 타임라인/로드맵 탭 — start~due 막대 (P2 구현, WMP-VIEW-002).
// :key → useProjectByKey로 numeric id 해소 후 timeline 조회. 일정 있는 항목만 표시.
import { useParams } from 'react-router-dom';
import { Skeleton } from '@therecommerce/ds-ui';
import { CalendarRange } from 'lucide-react';
import { useMemo } from 'react';
import { useProjectByKey } from '@/features/projects/hooks';
import { useTimeline, useProjectEpics } from '@/features/view/hooks';
import { useSprints } from '@/features/agile/hooks';
import { TimelineChart } from '@/features/view/components/TimelineChart';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-shell';

export function TimelineView() {
  const { key = '' } = useParams();
  const { data: project } = useProjectByKey(key);
  const { data, isPending } = useTimeline(project?.id);
  // 에픽 그룹/필터 라벨용 id→title 맵(CR-023). 에픽 조회 실패해도 차트는 "에픽 #id" 폴백.
  const { data: epics } = useProjectEpics(project?.id);
  const epicNames = useMemo(
    () => new Map((epics ?? []).map((e) => [e.id, e.title] as const)),
    [epics],
  );
  // 스프린트 오버레이 밴드용(CR-035) — 기간(startDate~endDate) 있는 스프린트만 사용.
  const { data: sprints } = useSprints(project?.id);

  if (isPending || !data) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-64 rounded" />
            <Skeleton className="h-6 flex-1 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-6" />}
        title="일정이 설정된 항목이 없습니다"
        description="시작일·기한이 지정된 업무가 타임라인에 표시됩니다."
      />
    );
  }

  return (
    // bodyOwnsScroll: 본문 높이 계약을 간트에 넘겨 간트가 자체 스크롤(가로 폭 폭발을 자기 안에 가둠).
    <PageShell bodyOwnsScroll>
      <TimelineChart
        items={data.items}
        links={data.links}
        projectId={project!.id}
        epicNames={epicNames}
        sprints={sprints ?? []}
      />
    </PageShell>
  );
}
