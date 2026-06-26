// 업무 상세 패널(§9.3 구조 그대로) — 풀페이지(WorkItemDetail)와 분할뷰(SplitView)가 공유.
// item을 직접 받는다(key 해소는 호출측 책임). compact=분할뷰용(헤더 화살표 등 축약 여지).
import { useRef } from 'react';
import { type WorkItemResponse, type Sprint } from '@/types/domain';
import { DetailHeader } from './DetailHeader';
import { DetailBody } from './DetailBody';
import { DetailSidePanel } from './DetailSidePanel';
import { SubtaskList } from './SubtaskList';
import { LinkedItems } from './LinkedItems';
import { CommentThread } from './CommentThread';
import { ActivityFeed } from './ActivityFeed';
import { ApprovalBanner } from './ApprovalBanner';

interface Props {
  item: WorkItemResponse;
  sprints: Sprint[];
  // 분할뷰: 우측 패널을 세로로 쌓고 너비 좁힘(세부사항을 본문 아래로).
  stacked?: boolean;
}

export function WorkItemDetailPanel({ item, sprints, stacked = false }: Props) {
  const addSubtaskRef = useRef<() => void>(() => {});
  const addLinkRef = useRef<() => void>(() => {});

  const body = (
    <div className="min-w-0 flex-1 space-y-6">
      <ApprovalBanner item={item} />
      <DetailBody item={item} />
      {item.issueType !== 'SUBTASK' && <SubtaskList item={item} addRef={addSubtaskRef} />}
      <LinkedItems item={item} addRef={addLinkRef} />
      <CommentThread item={item} />
      <ActivityFeed item={item} />
    </div>
  );

  return (
    <div>
      <DetailHeader
        item={item}
        onAddSubtask={() => addSubtaskRef.current()}
        onAddLink={() => addLinkRef.current()}
      />
      {stacked ? (
        <div className="space-y-6">
          <DetailSidePanel item={item} sprints={sprints} />
          {body}
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {body}
          <DetailSidePanel item={item} sprints={sprints} />
        </div>
      )}
    </div>
  );
}
