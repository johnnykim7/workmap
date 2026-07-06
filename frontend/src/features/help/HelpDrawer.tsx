// 도움말 드로어 — 헤더 ? 아이콘으로 여는 전역 오버레이(Sheet).
// 라우트 전환이 아니라 현재 화면/모달 위에 겹쳐 뜨므로(radix Dialog 포털), 닫으면 입력하던 것 그대로 복귀.
// 목차는 지금 1개("업무 유형과 작성 개념"). 도움말이 더 필요하면 SECTIONS에 항목을 추가하면 좌측 목차·본문이 함께 늘어난다.
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@therecommerce/ds-ui';
import { HelpCircle, Lock } from 'lucide-react';
import { TypeBadge } from '@/components/badges';
import type { IssueType } from '@/types/domain';
import { useUiStore } from '@/store/ui-store';

type SectionId = 'basics';

// 좌측 목차 항목 — 지금은 하나. 여기에 { id, label } 추가 + CONTENT에 분기만 넣으면 확장된다.
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'basics', label: '업무 유형과 작성 개념' },
];

// 계층 도식 한 줄 — 트리 연결선(lead) + 유형 배지 + 예시 + 설명.
// 실제 계층(실측): Epic은 트리 부모가 아니라 epic_id로 Story/Task를 "묶는" 그룹이고,
// Story·Task·Bug는 서로 동급(형제)이며, parent_id로 붙는 진짜 자식은 Sub-task뿐이다(depth≤2, BIZ-103).
// 그래서 lead에 미리 그린 트리 문자(공백/│/├/└)를 그대로 받아 형제·자식을 정확히 표현한다.
function TreeRow({ lead, type, example, desc }: { lead: string; type: IssueType; example: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1 font-mono text-[13px]">
      <span className="select-none whitespace-pre text-muted-foreground">{lead}</span>
      <span className="not-italic"><TypeBadge type={type} /></span>
      <span className="font-sans text-foreground">{example}</span>
      <span className="ml-auto whitespace-nowrap font-sans text-xs text-muted-foreground">{desc}</span>
    </div>
  );
}

// "언제 이 유형을 쓰나" 한 줄 정의.
function WhenRow({ type, children }: { type: IssueType; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <span className="shrink-0"><TypeBadge type={type} /></span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary">{children}</p>;
}

function BasicsContent() {
  return (
    <div className="space-y-8">
      {/* ── 계층 ── */}
      <section>
        <Eyebrow>한눈에 보기</Eyebrow>
        <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">Epic이 묶고, Story·Task가 나란히, 그 밑에 Sub-task</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          <b className="text-foreground">Epic</b>은 여러 작업을 묶는 <b className="text-foreground">큰 목표(그룹)</b>입니다.
          그 안의 <b className="text-foreground">Story</b>(사용자 가치)와 <b className="text-foreground">Task</b>(실행 작업)는
          <b className="text-foreground"> 서로 동급</b>이고 — Task는 Story의 하위가 아닙니다 — 각각을 더 쪼갠 것이
          <b className="text-foreground"> Sub-task</b>입니다.
        </p>

        <div className="mb-4 overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3">
          <TreeRow lead=""        type="EPIC"    example="반품 자동화" desc="큰 목표 · 여러 작업을 묶는 그룹" />
          <TreeRow lead=" ├ "     type="STORY"   example="고객이 반품을 신청한다" desc="사용자 가치" />
          <TreeRow lead=" │  └ "  type="SUBTASK" example="사유 선택 UI" desc="Story를 쪼갠 하위" />
          <TreeRow lead=" ├ "     type="TASK"    example="반품 신청 API 개발" desc="실행 작업 (Story와 동급)" />
          <TreeRow lead=" │  └ "  type="SUBTASK" example="DTO 검증 로직" desc="Task를 쪼갠 하위" />
          <TreeRow lead=" └ "     type="BUG"     example="첨부 실패 오류" desc="결함 (역시 동급)" />
        </div>

        <div className="space-y-2">
          <WhenRow type="EPIC"><b className="text-foreground">여러 작업으로 나뉘는 큰 목표</b>일 때. 한 번에 못 끝내는 덩어리를 <b className="text-foreground">묶는</b> 그룹.</WhenRow>
          <WhenRow type="STORY"><b className="text-foreground">“사용자가 ~할 수 있다”</b>로 말되는 하나의 완결 기능일 때.</WhenRow>
          <WhenRow type="TASK"><b className="text-foreground">담당자가 바로 손대는 작업.</b> 개발·문서·확인 등 실행 단위 (Story와 <b className="text-foreground">나란한 층</b>).</WhenRow>
          <WhenRow type="SUBTASK">Story·Task·Bug가 커서 <b className="text-foreground">여러 스텝으로 쪼개고 싶을</b> 때만. <b className="text-foreground">유일한 하위 계층</b>.</WhenRow>
        </div>
      </section>

      {/* ── 본문 · 댓글 · 결과 ── */}
      <section>
        <Eyebrow>가장 자주 헷갈리는 것</Eyebrow>
        <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">본문 · 댓글 · 결과는 역할이 다릅니다</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          하나의 업무 카드 안에서 <b className="text-foreground">쓰는 위치가 곧 의미</b>입니다. 시작할 때 지시를 적는 곳,
          진행하며 대화하는 곳, 끝나고 산출물을 적는 곳이 나뉘어 있습니다.
        </p>

        <div className="space-y-1.5">
          {/* 본문 */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-blue-600 dark:text-blue-400">
              본문 <span className="text-[11px] font-normal text-muted-foreground">— 시작할 때 채우는 요청·지시서</span>
            </div>
            <p className="rounded-md bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
              “반품 사유 5종 선택 + 사진 최대 3장 첨부되는 신청 폼. 미첨부 시 제출 불가.”
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground">↓ 작업이 진행되는 동안</p>
          {/* 댓글 */}
          <div className="rounded-lg border border-dashed border-border bg-card p-3">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-foreground">
              댓글 <span className="text-[11px] font-normal text-muted-foreground">— 진행 중의 질문·논의(티키타카)</span>
            </div>
            <p className="rounded-md bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
              “사유 5종 목록 확정됐나요?” · “네, 첨부해뒀습니다” · “리뷰 반영 완료”
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground">↓ 완료되면 열림</p>
          {/* 결과 */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-amber-600 dark:text-amber-500">
              결과 <span className="text-[11px] font-normal text-muted-foreground">— 무엇을 만들었는지, 완료 산출물</span>
            </div>
            <p className="rounded-md bg-muted/50 px-3 py-2 text-[13px] text-muted-foreground">
              “신청 화면 배포 완료. 스크린샷·PR #123 첨부. 실제 신청 3건 테스트 통과.”
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="size-3 text-amber-600 dark:text-amber-500" />
              결과란은 업무가 <b className="text-foreground">완료(DONE)</b> 상태가 되면 나타납니다.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-border border-l-[3px] border-l-primary bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">
          <b className="text-foreground">한 줄 원칙.</b> 본문 = <b className="text-foreground">시작 시 “무엇을·왜”</b>, 댓글 = <b className="text-foreground">진행 중 대화</b>,
          결과 = <b className="text-foreground">끝났을 때 “무엇을 만들었나”</b>. 본문에 결과를 적거나, 결과에 지시를 적지 않습니다.
        </div>
      </section>

      {/* ── Sub-task는 언제 나누나 ── */}
      <section>
        <Eyebrow>쪼갤까 말까</Eyebrow>
        <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">Sub-task는 “한 사람이 한 번에” 못 할 때만</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Story·Task가 <b className="text-foreground">여러 사람이 나눠 하거나</b>, <b className="text-foreground">단계가 여럿</b>이라
          하나로 진행 상태를 표현하기 어려울 때 Sub-task로 쪼갭니다. 작은 일까지 습관적으로 쪼개면 오히려 관리 부담만 늘어납니다.
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-green-600/25 bg-green-600/[0.07] p-3">
            <div className="mb-2 text-[11px] font-bold text-green-700 dark:text-green-400">✓ 쪼개면 좋은 경우</div>
            <ul className="ml-4 list-disc space-y-1.5 text-[13px] text-muted-foreground">
              <li><b className="text-foreground">담당이 갈릴 때</b> — “결제 연동” Task를 프론트 화면 / 백엔드 API로 나눠 각자 담당.</li>
              <li><b className="text-foreground">순서가 있는 단계</b> — “배포” Task를 빌드 → 스테이징 검증 → 운영 반영으로.</li>
              <li><b className="text-foreground">며칠 걸리는 큰 작업</b> — 진행이 “50%”처럼 안 보일 때 체크되는 하위로 나눠 진척 파악.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3">
            <div className="mb-2 text-[11px] font-bold text-red-600 dark:text-red-400">✗ 굳이 안 쪼개도 됨</div>
            <ul className="ml-4 list-disc space-y-1.5 text-[13px] text-muted-foreground">
              <li><b className="text-foreground">한 사람이 반나절이면 끝</b> — 그냥 Task 하나로.</li>
              <li><b className="text-foreground">그냥 할 일 목록</b> — 인수조건·체크리스트로 충분한 걸 Sub-task로 만들 필요 없음.</li>
              <li><b className="text-foreground">Sub-task를 또 쪼개려 할 때</b> — 계층은 2단까지. 더 쪼갤 일이면 Task를 늘리세요.</li>
            </ul>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-border border-l-[3px] border-l-primary bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">
          <b className="text-foreground">감별 한 줄.</b> “이걸 <b className="text-foreground">따로 담당·따로 완료</b>로 관리해야 하나?” → 예면 Sub-task,
          아니면 본문 지시나 인수조건 한 줄로 충분합니다.
        </div>
      </section>

      {/* ── 인수조건 ── */}
      <section>
        <Eyebrow>완료의 기준</Eyebrow>
        <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">인수조건은 “이러면 끝”의 체크리스트</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          인수조건(Acceptance Criteria)은 <b className="text-foreground">무엇이 되면 이 업무를 완료로 인정하는지</b>를 미리 정해두는
          목록입니다. 모호하게 “잘 되게”가 아니라, 확인 가능한 항목으로 적습니다. (Story 상세에서 한 줄에 하나씩 입력)
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3">
            <div className="mb-1.5 text-[11px] font-bold text-red-600 dark:text-red-400">✗ 이렇게 적지 마세요</div>
            <p className="text-[13px] text-muted-foreground">“신청 화면 잘 되게 만든다”</p>
          </div>
          <div className="rounded-lg border border-green-600/25 bg-green-600/[0.07] p-3">
            <div className="mb-1.5 text-[11px] font-bold text-green-700 dark:text-green-400">✓ 이렇게</div>
            <ul className="ml-4 list-disc space-y-0.5 text-[13px] text-muted-foreground">
              <li>사유 5종 선택 가능</li>
              <li>사진 3장까지 첨부</li>
              <li>미첨부 시 제출 버튼 비활성</li>
            </ul>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-border border-l-[3px] border-l-primary bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">
          <b className="text-foreground">결과와의 관계.</b> 인수조건은 <b className="text-foreground">시작할 때</b> “끝의 정의”를 정해두는 것이고,
          결과는 <b className="text-foreground">끝났을 때</b> 그 조건을 실제로 채운 산출물을 적는 곳입니다.
        </div>
      </section>
    </div>
  );
}

/** 헤더의 ? 아이콘 트리거. 클릭 시 전역 도움말 드로어를 연다(모달 안 버튼과 같은 드로어). */
export function HelpTrigger() {
  const openHelp = useUiStore((s) => s.openHelp);
  return (
    <button
      type="button"
      onClick={openHelp}
      aria-label="도움말"
      className="flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <HelpCircle className="size-5" />
    </button>
  );
}

/**
 * 도움말 드로어 본체. AppShell에 한 번만 마운트한다.
 * 열림 상태는 전역(ui-store) — 헤더 ? 아이콘과 만들기 모달 안 ? 버튼이 같은 드로어를 연다.
 * radix Dialog 포털이라 만들기 모달 위에 겹쳐 뜨고, 닫으면 모달 입력은 그대로 유지된다.
 */
export function HelpDrawer() {
  const open = useUiStore((s) => s.helpOpen);
  const setOpen = useUiStore((s) => s.setHelpOpen);
  const [active, setActive] = useState<SectionId>('basics');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-[15px]">
            <HelpCircle className="size-4 text-primary" /> WorkMap 도움말
          </SheetTitle>
          <SheetDescription className="sr-only">업무 유형과 작성 개념 안내</SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 grid-cols-[148px_1fr]">
          {/* 좌측 목차 — 지금은 1개, 필요할 때 하나씩 추가 */}
          <nav className="border-r border-border bg-muted/30 p-2">
            <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">목차</p>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`block w-full rounded-md px-2.5 py-2 text-left text-[13px] leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active === s.id
                    ? 'bg-card font-semibold text-foreground shadow-[inset_2px_0_0] shadow-primary'
                    : 'text-muted-foreground hover:bg-card/60'
                }`}
              >
                {s.label}
              </button>
            ))}
            <p className="px-2.5 pt-3 text-[11px] leading-relaxed text-muted-foreground/80">
              필요할 때 항목이 하나씩 추가됩니다
            </p>
          </nav>

          {/* 우측 본문 */}
          <div className="min-w-0 overflow-y-auto px-6 py-5">
            {active === 'basics' && <BasicsContent />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
