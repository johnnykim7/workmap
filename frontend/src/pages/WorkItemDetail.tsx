// 업무 상세 (/work-items/:key) — §9.3. 보드/백로그/목록/검색/받은함 카드 클릭 도착지(딥링크 풀페이지).
// key→id 해소(useWorkItemByKey). 상세 구조는 WorkItemDetailPanel(분할뷰와 공유)에 위임.
import { useParams } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { WorkItemDetailSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { useSprints } from '@/features/agile/hooks';
import { useWorkItemByKey } from '@/features/workitem/hooks';
import { WorkItemDetailPanel } from '@/features/workitem/components/WorkItemDetailPanel';

export function WorkItemDetail() {
  const { key = '' } = useParams();
  const { data: item, isPending, isError } = useWorkItemByKey(key);
  const { data: sprints = [] } = useSprints(item?.projectId);

  if (isPending) return <WorkItemDetailSkeleton />;

  if (isError || !item) {
    return (
      <EmptyState
        icon={<FileQuestion className="size-6" />}
        title="업무를 찾을 수 없습니다"
        description={`"${key}"에 해당하는 업무가 없거나 접근 권한이 없습니다.`}
      />
    );
  }

  return (
    // w-full 필수: 이 div는 AppShell의 flex-col 자식이라 max-w가 걸리면 stretch가 무효화돼
    // 콘텐츠 폭(min-content)으로 줄어든다 → 콘텐츠 적은 항목이 왼쪽으로 쏠린다. w-full로 항상 최대폭.
    <div className="mx-auto w-full max-w-6xl">
      <WorkItemDetailPanel item={item} sprints={sprints} />
    </div>
  );
}
