// 업무 상세 패널(§9.3 구조 그대로) — 풀페이지(WorkItemDetail)와 분할뷰(SplitView)가 공유.
// item을 직접 받는다(key 해소는 호출측 책임). compact=분할뷰용(헤더 화살표 등 축약 여지).
import { useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type WorkItemResponse, type Sprint, type WorkStatus } from '@/types/domain';
import { DetailHeader } from './DetailHeader';
import { DetailBody } from './DetailBody';
import { DetailSidePanel } from './DetailSidePanel';
import { SubtaskList } from './SubtaskList';
import { LinkedItems } from './LinkedItems';
import { ParentLink } from './ParentLink';
import { Attachments } from './Attachments';
import { ResultSection } from './ResultSection';
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
    <div className="min-w-0 flex-1 space-y-5 lg:pl-4">
      {/* 승인 배너는 자체 카드형이라 구분선 규칙 밖에 둔다. */}
      <ApprovalBanner item={item} />
      {/* 콘텐츠 섹션: 구분선을 각 섹션 '위'(다음 섹션 제목 머리)에 둔다 — 선이 다음 블록의 시작을 알린다.
          첫 섹션은 위 선·패딩 제거. 자체 카드형(결과)은 [&>.detail-card]로 위 선 제외 — 카드 테두리와 겹침 방지.
          ⚠️ border-t 색은 Tailwind v4/ds-ui 혼재로 currentColor(검정)로 떨어짐 → main.css .detail-sections 규칙으로 색 강제. */}
      {/* 주요 섹션(항상 펼침): 설명 → 첨부 → [부가 묶음] → 결과 → 활동.
          부가(하위작업·연결업무·운영)는 CollapsibleGroup으로 통으로 접기 — 화면을 가볍게. */}
      <div className="detail-sections [&>*:not(:first-child)]:mt-5 [&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:pt-5">
        <DetailBody item={item} />
        <Attachments item={item} addRef={addAttachmentRef} />

        <CollapsibleGroup title="하위 작업 · 연결 · 운영">
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
        </CollapsibleGroup>

        {/* 결과(완료 산출물) — 완료 상태일 때만 렌더(내부에서 isDoneStatus 가드), CR-048 */}
        <ResultSection item={item} />
        <ActivityTabs item={item} />
      </div>
    </div>
  );

  return (
    // 높이 계약: 부모(풀페이지=PageShell bodyOwnsScroll / 분할뷰=고정 높이 컬럼)가 준 높이를 받아
    // 세로 flex로 쪼갠다 — 헤더 고정(shrink-0) + 본문 영역(flex-1 min-h-0, 이 안에서 스크롤).
    // w-full 필수 — 없으면 flex-1 본문이 콘텐츠 폭만큼만 차지해 부모(max-w-6xl)가 shrink, 왼쪽 쏠림.
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* 헤더 = 고정. 본문(lg:pl-4)과 같은 왼쪽 시작선에 맞춤(제목이 본문보다 튀어나오던 것 방지). */}
      <div className="shrink-0 lg:pl-4">
        <DetailHeader
          item={item}
          showBack={!stacked}
          onAddSubtask={() => addSubtaskRef.current()}
          onAddLink={() => addLinkRef.current()}
          onAddAttachment={() => addAttachmentRef.current()}
        />
      </div>
      {stacked ? (
        // 분할뷰 우측: 좁아서 세로로 쌓임(반응형). 본문+세부사항 통째로 이 영역만 세로 스크롤.
        // min-w-0 + overflow-x-hidden: 세부사항(w-80 등) 자식 폭이 컨테이너를 넘어 가로 스크롤이
        // 생기던 것 차단. 세로만 스크롤한다.
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {/* [&_aside]:w-full: SidePanel의 lg:w-80(뷰포트 기준 320px 고정)이 좁은 분할뷰 우측에서
              가로 넘침을 만들던 것 차단 — stacked에서는 세부사항을 항상 전체폭 세로 쌓기. */}
          <div className="flex flex-col gap-6 [&_aside]:w-full [&_aside]:lg:w-full">
            {body}
            <DetailSidePanel item={item} sprints={sprints} />
          </div>
        </div>
      ) : (
        // 풀페이지: 본문(설명) 좌 + 세부사항 우 — Jira 정합으로 좌/우 각각 독립 스크롤.
        // 헤더는 위에서 고정됐고, 이 flex-row 영역이 남은 높이를 채워 두 컬럼이 각자 overflow-y-auto.
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{body}</div>
          <div className="min-w-0 overflow-x-hidden overflow-y-auto lg:shrink-0">
            <DetailSidePanel item={item} sprints={sprints} />
          </div>
        </div>
      )}
    </div>
  );
}

// 부가 섹션 묶음 — 하위작업·연결업무·운영을 통으로 접었다 펼친다(기본 접힘). 화면을 가볍게.
// 내부 섹션들도 detail-sections 패턴으로 서로 얇은 구분선을 가진다.
function CollapsibleGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-sm font-semibold text-foreground"
      >
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        {title}
      </button>
      {open && (
        <div className="detail-sections mt-4 [&>*:not(:first-child)]:mt-5 [&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:pt-5">
          {children}
        </div>
      )}
    </section>
  );
}
