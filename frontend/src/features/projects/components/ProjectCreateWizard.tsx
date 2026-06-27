// 프로젝트 생성 마법사 (T3-3 §프로젝트 생성 마법사 — 다단계 Jira식).
// 4단계: ①템플릿 ②이름·키·워크스페이스·기간 ③설정 확인(유형/탭/샘플 토글) ④멤버·가시성.
// 자체 composite(execution-spec 허용 목록 ProjectCreateWizard). ds-ui Dialog+Stepper 조립.
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Stepper, Button, Input, Switch, Spinner, DatePicker,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Field } from '@/components/common/field';
import { fromIso, toIso } from '@/lib/date';
import { ProjectTypeBadge } from './ProjectTypeBadge';
import { MemberPicker } from '@/features/members/components/MemberPicker';
import { memberApi } from '@/features/members/api';
import { useProjectTemplates, useWorkspaces } from '@/features/workspaces/hooks';
import { useCreateProject } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/route-paths';
import {
  ISSUE_TYPE_LABEL, PROJECT_TAB_LABEL,
  type IssueType, type ProjectTemplate, type User,
} from '@/types/domain';

const STEPS = [
  { label: '템플릿' },
  { label: '이름·키' },
  { label: '설정 확인' },
  { label: '멤버·가시성' },
];

interface WizardState {
  templateId?: number;
  name: string;
  key: string;
  workspaceId?: number;
  startDate: string;
  endDate: string;
  withSample: boolean;
  visibility: 'PUBLIC' | 'PRIVATE';
  members: User[];
}

const initial: WizardState = {
  name: '', key: '', startDate: '', endDate: '',
  withSample: false, visibility: 'PUBLIC', members: [],
};

const KEY_RE = /^[A-Z][A-Z0-9]{1,9}$/;

export function ProjectCreateWizard({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardState>(initial);
  const navigate = useNavigate();

  const templates = useProjectTemplates();
  const { data: workspaces = [] } = useWorkspaces();
  const createMutation = useCreateProject();

  const tpl: ProjectTemplate | undefined = templates.find((t) => t.id === s.templateId);
  const patch = (p: Partial<WizardState>) => setS((prev) => ({ ...prev, ...p }));

  function reset() {
    setStep(0);
    setS(initial);
  }
  function close() {
    if (createMutation.isPending) return;
    onOpenChange(false);
    // 닫힘 애니메이션 후 초기화
    setTimeout(reset, 200);
  }

  // 단계별 진행 가능 여부
  const canNext =
    step === 0 ? !!s.templateId
    : step === 1 ? s.name.trim().length > 0 && KEY_RE.test(s.key) && !!s.workspaceId
    : true;

  const keyError =
    s.key.length > 0 && !KEY_RE.test(s.key)
      ? '대문자로 시작하는 2~10자 영문/숫자'
      : undefined;

  function submit() {
    if (!s.templateId || !s.workspaceId) return;
    // BE CreateRequest는 멤버/샘플을 받지 않음 → 생성 후 멤버는 별도 초대(POST .../members).
    createMutation.mutate(
      {
        name: s.name.trim(),
        key: s.key,
        workspaceId: s.workspaceId,
        templateId: s.templateId,
        visibility: s.visibility,
        startDate: s.startDate || undefined,
        endDate: s.endDate || undefined,
      },
      {
        onSuccess: async (project) => {
          // 생성자는 BE가 MANAGER로 자동 등록. 선택 멤버만 추가 초대.
          for (const m of s.members) {
            try {
              await memberApi.invite(project.id, { userId: m.id, role: 'MEMBER' });
            } catch {
              /* 개별 초대 실패는 무시(요약 화면에서 재초대 가능) */
            }
          }
          onOpenChange(false);
          setTimeout(reset, 200);
          navigate(ROUTES.project(project.key));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>프로젝트 만들기</DialogTitle>
          <DialogDescription>각 항목은 나중에 프로젝트 설정에서 변경할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <Stepper steps={STEPS} activeStep={step} size="sm" className="my-2" />

        <div className="min-h-[280px] py-2">
          {/* 1. 템플릿 선택 */}
          {step === 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {templates.map((t) => {
                const active = s.templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch({ templateId: t.id })}
                    className={`flex flex-col rounded-lg border p-4 text-left transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <ProjectTypeBadge type={t.code} />
                      {active && <Check className="size-4 text-primary" />}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. 이름·키·워크스페이스·기간 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Field label="프로젝트명" required htmlFor="p-name">
                <Input
                  id="p-name"
                  placeholder="예: WMS 1.0 구축"
                  value={s.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </Field>
              <Field label="키(접두어)" required error={keyError} htmlFor="p-key">
                <Input
                  id="p-key"
                  placeholder="예: WMS"
                  value={s.key}
                  onChange={(e) => patch({ key: e.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="워크스페이스" required htmlFor="p-ws">
                <Select
                  value={s.workspaceId ? String(s.workspaceId) : undefined}
                  onValueChange={(v) => patch({ workspaceId: Number(v) })}
                >
                  <SelectTrigger id="p-ws"><SelectValue placeholder="워크스페이스 선택" /></SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="시작일" htmlFor="p-start">
                  <DatePicker
                    className="w-full"
                    placeholder="시작일 선택"
                    value={fromIso(s.startDate)}
                    onChange={(d) => patch({ startDate: toIso(d) })}
                  />
                </Field>
                <Field label="종료일" htmlFor="p-end">
                  <DatePicker
                    className="w-full"
                    placeholder="종료일 선택"
                    value={fromIso(s.endDate)}
                    onChange={(d) => patch({ endDate: toIso(d) })}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* 3. 설정 확인 — 템플릿이 채운 유형/탭 + 샘플 토글 */}
          {step === 2 && tpl && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">업무 유형</div>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.issueTypeCodes.map((c) => (
                    <span key={c} className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                      {ISSUE_TYPE_LABEL[c as IssueType] ?? c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">기본 보기(탭)</div>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.defaultTabs.map((tab) => (
                    <span key={tab} className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                      {PROJECT_TAB_LABEL[tab] ?? tab}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 opacity-60">
                <div>
                  <div className="text-sm font-medium text-foreground">샘플 업무 항목으로 시작</div>
                  <div className="text-xs text-muted-foreground">예시 데이터 시드는 work_item(Sprint 3) 이후 지원됩니다.</div>
                </div>
                <Switch checked={s.withSample} onCheckedChange={(v) => patch({ withSample: v })} disabled />
              </div>
            </div>
          )}

          {/* 4. 멤버·가시성 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 text-sm font-medium text-foreground">멤버 초대(선택)</div>
                <MemberPicker
                  selected={s.members}
                  onChange={(members) => patch({ members })}
                />
              </div>
              <Field label="가시성" htmlFor="p-vis">
                <Select value={s.visibility} onValueChange={(v) => patch({ visibility: v as 'PUBLIC' | 'PRIVATE' })}>
                  <SelectTrigger id="p-vis"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">공개 — 모든 사용자가 볼 수 있음</SelectItem>
                    <SelectItem value="PRIVATE">비공개 — 멤버만(BIZ-108)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
        </div>

        <DialogFooter className="justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? close() : setStep((n) => n - 1))} disabled={createMutation.isPending}>
            {step === 0 ? '취소' : (<><ArrowLeft className="size-4" /> 이전</>)}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((n) => n + 1)} disabled={!canNext}>
              다음 <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Spinner className="size-4" />}
              프로젝트 만들기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
