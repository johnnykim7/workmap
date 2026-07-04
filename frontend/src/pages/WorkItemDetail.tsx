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
    <div className="w-full">
      <WorkItemDetailPanel item={item} sprints={sprints} />
    </div>
  );
}
