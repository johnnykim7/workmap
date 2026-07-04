// 업무 상세 패널(§9.3 구조 그대로) — 풀페이지(WorkItemDetail)와 분할뷰(SplitView)가 공유.
// item을 직접 받는다(key 해소는 호출측 책임). compact=분할뷰용(헤더 화살표 등 축약 여지).
import { useRef } from 'react';
import { type WorkItemResponse, type Sprint, type WorkStatus } from '@/types/domain';
import { DetailHeader } from './DetailHeader';
import { DetailBody } from './DetailBody';
import { DetailSidePanel } from './DetailSidePanel';
import { SubtaskList } from './SubtaskList';
import { LinkedItems } from './LinkedItems';
import { ParentLink } from './ParentLink';
import { Attachments } from './Attachments';
import { ActivityTabs } from './ActivityTabs';
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
      {/* 순서(Jira 정합): 설명 → 첨부 → (하위작업|상위작업) → 연결된업무. 설명·첨부는 붙인다. */}
      <Attachments item={item} addRef={addAttachmentRef} />
      {item.issueType !== 'SUBTASK' && <SubtaskList item={item} addRef={addSubtaskRef} />}
      {item.issueType === 'SUBTASK' && item.parentId != null && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold text-foreground">상위 작업</h2>
          <ParentLink parentId={item.parentId} projectId={item.projectId} />
        </section>
      )}
      <LinkedItems item={item} addRef={addLinkRef} />
      {OPS_STATUSES.has(item.commonStatus) && <FieldVerifications item={item} />}
      {OPS_STATUSES.has(item.commonStatus) && <PromoteToBacklog item={item} />}
      <ActivityTabs item={item} />
    </div>
  );

  return (
    <div>
      <DetailHeader
        item={item}
        showBack={!stacked}
        onAddSubtask={() => addSubtaskRef.current()}
        onAddLink={() => addLinkRef.current()}
        onAddAttachment={() => addAttachmentRef.current()}
      />
      {/* 분할뷰든 풀페이지든 동일 레이아웃: 본문(설명) 좌 + 세부사항 우.
          폭이 좁으면(분할뷰 우측) lg 미만에서 자연히 세로로 접힘(반응형). Jira 정합. */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {body}
        <DetailSidePanel item={item} sprints={sprints} />
      </div>
    </div>
  );
}
