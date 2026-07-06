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

type SectionId = 'basics';

// 좌측 목차 항목 — 지금은 하나. 여기에 { id, label } 추가 + CONTENT에 분기만 넣으면 확장된다.
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'basics', label: '업무 유형과 작성 개념' },
];

// 계층 도식 한 줄 — 들여쓰기(depth) + 유형 배지 + 예시 + 설명.
function TreeRow({ depth, type, example, desc }: { depth: number; type: IssueType; example: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1 font-mono text-[13px]">
      <span className="select-none text-muted-foreground">{depth > 0 ? `${' '.repeat(depth * 3)}└ ` : ''}</span>
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
        <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">업무는 4단계로 쌓입니다</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          큰 목표(Epic)를 사용자 가치 단위(Story)로, 다시 실제 작업(Task)으로 쪼갭니다. 아래로 갈수록 작고 구체적입니다.
        </p>

        <div className="mb-4 overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3">
          <TreeRow depth={0} type="EPIC" example="반품 자동화" desc="큰 목표 · 수 주~수 개월" />
          <TreeRow depth={1} type="STORY" example="고객이 반품을 신청한다" desc="완결된 사용자 가치" />
          <TreeRow depth={2} type="TASK" example="반품 신청 API 개발" desc="실제 작업 · 하루~며칠" />
          <TreeRow depth={3} type="SUBTASK" example="DTO 검증 로직" desc="Task를 쪼갠 체크리스트" />
        </div>

        <div className="space-y-2">
          <WhenRow type="EPIC"><b className="text-foreground">여러 Story로 나뉘는 큰 목표</b>일 때. 한 번에 못 끝내는 덩어리.</WhenRow>
          <WhenRow type="STORY"><b className="text-foreground">“사용자가 ~할 수 있다”</b>로 말되는 하나의 완결 기능일 때.</WhenRow>
          <WhenRow type="TASK"><b className="text-foreground">담당자가 바로 손대는 작업.</b> 개발·문서·확인 등 실행 단위.</WhenRow>
          <WhenRow type="SUBTASK">Task가 커서 <b className="text-foreground">여러 스텝으로 쪼개고 싶을</b> 때만.</WhenRow>
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

/** 헤더 ? 아이콘 + 도움말 드로어. AppShell HeaderActions에서 사용. */
export function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SectionId>('basics');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="도움말"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HelpCircle className="size-5" />
      </button>

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
