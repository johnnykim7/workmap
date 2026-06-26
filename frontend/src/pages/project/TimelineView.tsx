// 타임라인/로드맵 탭 — start~due 막대 (P2 구현, WMP-VIEW-002).
// :key → useProjectByKey로 numeric id 해소 후 timeline 조회. 일정 있는 항목만 표시.
import { useParams } from 'react-router-dom';
import { Skeleton } from '@therecommerce/ds-ui';
import { CalendarRange } from 'lucide-react';
import { useProjectByKey } from '@/features/projects/hooks';
import { useTimeline } from '@/features/view/hooks';
import { TimelineChart } from '@/features/view/components/TimelineChart';
import { EmptyState } from '@/components/common/empty-state';

export function TimelineView() {
  const { key = '' } = useParams();
  const { data: project } = useProjectByKey(key);
  const { data, isPending } = useTimeline(project?.id);

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

  return <TimelineChart items={data.items} />;
}
