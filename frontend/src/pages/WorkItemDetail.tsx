// 업무 상세 (/work-items/:key) — §9.3. 보드/백로그/목록/검색/받은함 카드 클릭 도착지.
// 진입 형태(분할뷰/모달/딥링크) 무관 동일 구조: 상단 바 + 본문(유형별 분기) + 우측 접이식 패널.
// key→id 해소(useWorkItemByKey, keyword 검색). BE 신규 없음.
import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { WorkItemDetailSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common/empty-state';
import { useSprints } from '@/features/agile/hooks';
import { useWorkItemByKey } from '@/features/workitem/hooks';
import { DetailHeader } from '@/features/workitem/components/DetailHeader';
import { DetailBody } from '@/features/workitem/components/DetailBody';
import { DetailSidePanel } from '@/features/workitem/components/DetailSidePanel';
import { SubtaskList } from '@/features/workitem/components/SubtaskList';
import { LinkedItems } from '@/features/workitem/components/LinkedItems';
import { CommentThread } from '@/features/workitem/components/CommentThread';
import { ActivityFeed } from '@/features/workitem/components/ActivityFeed';
import { ApprovalBanner } from '@/features/workitem/components/ApprovalBanner';

export function WorkItemDetail() {
  const { key = '' } = useParams();
  const { data: item, isPending, isError } = useWorkItemByKey(key);
  const { data: sprints = [] } = useSprints(item?.projectId);

  // +액션 메뉴 → 하위작업/연결 추가 트리거(섹션 내부 토글로 위임).
  const addSubtaskRef = useRef<() => void>(() => {});
  const addLinkRef = useRef<() => void>(() => {});

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
    <div className="mx-auto max-w-6xl">
      <DetailHeader
        item={item}
        onAddSubtask={() => addSubtaskRef.current()}
        onAddLink={() => addLinkRef.current()}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 본문 */}
        <div className="min-w-0 flex-1 space-y-6">
          <ApprovalBanner item={item} />
          <DetailBody item={item} />
          {/* 하위 작업 ≠ 연결된 업무 (별개 섹션, §9.3) */}
          {item.issueType !== 'SUBTASK' && <SubtaskList item={item} addRef={addSubtaskRef} />}
          <LinkedItems item={item} addRef={addLinkRef} />
          <CommentThread item={item} />
          <ActivityFeed item={item} />
        </div>

        {/* 우측 패널 */}
        <DetailSidePanel item={item} sprints={sprints} />
      </div>
    </div>
  );
}
