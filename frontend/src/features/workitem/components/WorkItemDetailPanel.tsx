// 업무 상세 패널(§9.3 구조 그대로) — 풀페이지(WorkItemDetail)와 분할뷰(SplitView)가 공유.
// item을 직접 받는다(key 해소는 호출측 책임). compact=분할뷰용(헤더 화살표 등 축약 여지).
import { useRef } from 'react';
import { type WorkItemResponse, type Sprint, type WorkStatus } from '@/types/domain';
import { DetailHeader } from './DetailHeader';
import { DetailBody } from './DetailBody';
import { DetailSidePanel } from './DetailSidePanel';
import { SubtaskList } from './SubtaskList';
import { LinkedItems } from './LinkedItems';
import { Attachments } from './Attachments';
import { CommentThread } from './CommentThread';
import { ActivityFeed } from './ActivityFeed';
import { ApprovalBanner } from './ApprovalBanner';
import { FieldVerifications } from '@/features/ops/components/FieldVerifications';
import { PromoteToBacklog } from '@/features/ops/components/PromoteToBacklog';

// 운영형(접수·처리·현장) 워크플로 상태 — 현장검증 섹션 노출 신호(WMP-OPS-004).
const OPS_STATUSES = new Set<WorkStatus>([
  'RECEIVED', 'CHECKING', 'PROCESSING', 'FIELD_CHECK', 'HOLD', 'DEV_DONE', 'FIELD_VERIFY', 'OPS_APPLIED',
]);

interface Props {
  item: WorkItemResponse;
  sprints: Sprint[];
  // 분할뷰: 우측 패널을 세로로 쌓고 너비 좁힘(세부사항을 본문 아래로).
  stacked?: boolean;
}

export function WorkItemDetailPanel({ item, sprints, stacked = false }: Props) {
  const addSubtaskRef = useRef<() => void>(() => {});
  const addLinkRef = useRef<() => void>(() => {});
  const addAttachmentRef = useRef<() => void>(() => {});

  const body = (
    <div className="min-w-0 flex-1 space-y-6">
      <ApprovalBanner item={item} />
      <DetailBody item={item} />
      {item.issueType !== 'SUBTASK' && <SubtaskList item={item} addRef={addSubtaskRef} />}
      <LinkedItems item={item} addRef={addLinkRef} />
      <Attachments item={item} addRef={addAttachmentRef} />
      {OPS_STATUSES.has(item.commonStatus) && <FieldVerifications item={item} />}
      {OPS_STATUSES.has(item.commonStatus) && <PromoteToBacklog item={item} />}
      <CommentThread item={item} />
      <ActivityFeed item={item} />
    </div>
  );

  return (
    <div>
      {/* 상단 헤더 고정 — 분할뷰(stacked)에선 우측 패널 내부에서, 풀페이지에선 콘텐츠 상단에서 sticky.
          AdminShell 헤더 h-14(56px) 아래에 붙는다(top-0 = 본문 컨테이너 기준 상단). */}
      <div className="sticky top-14 z-10 bg-background pt-1">
        <DetailHeader
          item={item}
          showBack={!stacked}
          onAddSubtask={() => addSubtaskRef.current()}
          onAddLink={() => addLinkRef.current()}
          onAddAttachment={() => addAttachmentRef.current()}
        />
      </div>
      {/* 분할뷰든 풀페이지든 동일 레이아웃: 본문(설명) 좌 + 세부사항 우.
          폭이 좁으면(분할뷰 우측) lg 미만에서 자연히 세로로 접힘(반응형). Jira 정합. */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {body}
        <DetailSidePanel item={item} sprints={sprints} />
      </div>
    </div>
  );
}
