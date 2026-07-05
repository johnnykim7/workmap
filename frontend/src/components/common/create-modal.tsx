// 전역 [만들기] 모달 (§9.4 업무 만들기, WMP-WI-001) — ds-ui Dialog + RHF + Zod.
// "만들기는 가볍게": 필수=프로젝트·유형·요약 / 선택=설명·담당자·우선순위·라벨·Epic.
// 유형별 풍부한 필드(인수조건/재현절차 등)는 모달에 없음 — 만든 뒤 상세에서 채움(§9.3).
// 상태는 BE가 워크플로 시작 상태로 고정(status_id 입력 무시, WI-3).
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Spinner, Checkbox, DatePicker,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Plus, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { Field } from './field';
import { RichTextEditor } from './rich-text-editor';
import { useUiStore } from '@/store/ui-store';
import { useProjects } from '@/features/projects/hooks';
import { useMembers } from '@/features/members/hooks';
import { useCreateWorkItem } from '@/features/workitem/hooks';
import { workItemApi } from '@/features/workitem/api';
import { TypeOption } from '@/components/badges';
import {
  ISSUE_TYPE_LABEL, PRIORITY_LABEL, PROJECT_TEMPLATES, STORY_VS_TASK_HINT,
  type IssueType, type Priority,
} from '@/types/domain';
import { ROUTES } from '@/lib/route-paths';
import { toIso, fromIso } from '@/lib/date';

const NONE = '__none__'; // Radix Select 빈 값 불가 → 미선택 센티넬

const schema = z.object({
  projectId: z.coerce.number().int().positive('프로젝트를 선택하세요.'),
  issueType: z.string().min(1, '업무 유형을 선택하세요.'),
  title: z.string().trim().min(1, '요약을 입력하세요.').max(300),
  description: z.string().trim().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  labels: z.string().optional(), // 콤마 구분 입력 → 배열 변환
  dueDate: z.string().optional(), // yyyy-MM-dd, 캘린더 빈칸 클릭 시 프리필(CR-021)
});
type FormValues = z.input<typeof schema>;

const PRIORITIES: Priority[] = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'];

const EMPTY = {
  projectId: undefined,
  issueType: '',
  title: '',
  description: '',
  priority: 'MEDIUM',
  assigneeId: NONE,
  epicId: NONE,
  labels: '',
  dueDate: '',
} as const;

export function CreateModal() {
  const open = useUiStore((s) => s.createModalOpen);
  const prefill = useUiStore((s) => s.createModalPrefill);
  const close = useUiStore((s) => s.closeCreateModal);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [keepOpen, setKeepOpen] = useState(false);
  // "만들기는 가볍게": 선택 필드(담당자·우선순위·Epic·마감·라벨)는 기본 접힘. 필수 3개만 먼저 보인다.
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: projects = [] } = useProjects({});
  const createMut = useCreateWorkItem();

  // 현재 프로젝트 컨텍스트 추론(#15) — /projects/:key/* 화면에서 열면 그 프로젝트로 프리셋·잠금.
  // CreateModal은 AppShell(Outlet 바깥)에 마운트돼 useParams로는 :key를 못 받음 → pathname 파싱.
  const ctxKey = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const ctxProject = ctxKey ? projects.find((p) => p.key === ctxKey) : undefined;

  const { register, handleSubmit, reset, control, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { ...EMPTY },
    });

  // 모달이 열리면 폼 초기화 + 프로젝트 컨텍스트가 있으면 그 프로젝트로 프리셋. 닫히면 비움.
  // CR-021: 캘린더 빈칸 클릭 등으로 prefill(projectId·dueDate)이 오면 그 값을 우선 적용.
  useEffect(() => {
    if (open) {
      reset({
        ...EMPTY,
        projectId: prefill?.projectId ?? ctxProject?.id,
        dueDate: prefill?.dueDate ?? '',
      });
      setMoreOpen(false); // 열 때마다 선택 필드는 접힌 상태로 시작.
    } else reset({ ...EMPTY });
    // ctxProject는 projects 로딩 후 채워지므로 id도 의존성에 포함.
  }, [open, ctxProject?.id, prefill?.projectId, prefill?.dueDate, reset]);

  const projectIdRaw = watch('projectId');
  const selectedProjectId = projectIdRaw ? Number(projectIdRaw) : undefined;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // 선택 프로젝트의 템플릿이 허용하는 업무 유형만 노출(§7 유형 프리셋).
  const allowedTypes = useMemo<IssueType[]>(() => {
    const tpl = PROJECT_TEMPLATES.find((t) => t.id === selectedProject?.templateId);
    return (tpl?.issueTypeCodes ?? ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK']) as IssueType[];
  }, [selectedProject]);

  // 담당자 후보 = 선택 프로젝트 멤버.
  const { data: members = [] } = useMembers(selectedProjectId);

  // Epic 후보 = 선택 프로젝트의 EPIC 항목(신규 BE 없음 — 프로젝트 항목에서 클라 필터).
  const { data: epics = [] } = useQuery({
    queryKey: ['work-items', 'epics', selectedProjectId],
    queryFn: () => workItemApi.listByProject(selectedProjectId!),
    enabled: !!selectedProjectId,
    select: (page) => page.items.filter((w) => w.issueType === 'EPIC'),
  });

  const submit = handleSubmit((v) => {
    const labels = (v.labels ?? '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    createMut.mutate(
      {
        projectId: Number(v.projectId),
        issueType: v.issueType as IssueType,
        title: v.title.trim(),
        description: v.description?.trim() || undefined,
        priority: (v.priority as Priority) || undefined,
        assigneeId: v.assigneeId && v.assigneeId !== NONE ? Number(v.assigneeId) : null,
        epicId: v.epicId && v.epicId !== NONE ? Number(v.epicId) : null,
        labels: labels.length ? labels : undefined,
        dueDate: v.dueDate || undefined,
      },
      {
        onSuccess: (created) => {
          if (keepOpen) {
            // 연속 생성: 프로젝트·유형·마감일(CR-021)은 유지하고 요약/설명/라벨만 비움.
            reset({
              ...EMPTY,
              projectId: created.projectId as unknown as undefined,
              issueType: created.issueType,
              dueDate: v.dueDate || '',
            });
          } else {
            close();
            navigate(ROUTES.workItem(created.key));
          }
        },
      },
    );
  });

  const busy = createMut.isPending;
  const watchType = watch('issueType');
  const titleLabel = watchType ? `${ISSUE_TYPE_LABEL[watchType as IssueType]} 만들기` : '업무 만들기';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy && !v) close(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titleLabel}</DialogTitle>
          <DialogDescription>
            만들기는 가볍게 — 만든 뒤 상세에서 더 채울 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="프로젝트" required error={errors.projectId?.message}>
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val) => field.onChange(Number(val))}
                    disabled={!!ctxProject}
                  >
                    <SelectTrigger><SelectValue placeholder="프로젝트 선택" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} ({p.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="업무 유형" required error={errors.issueType?.message}>
              <Controller
                control={control}
                name="issueType"
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={!selectedProjectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProjectId ? '유형 선택' : '먼저 프로젝트 선택'} />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map((t) => (
                        <SelectItem key={t} value={t}><TypeOption type={t} withDesc /></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          {/* Story·Task가 둘 다 선택 가능한 템플릿에서만 구분 힌트(자동 판정은 불가 — 사람이 고르는 기준만 제시). */}
          {allowedTypes.includes('STORY') && allowedTypes.includes('TASK') && (
            <p className="-mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
              <span>{STORY_VS_TASK_HINT}</span>
            </p>
          )}

          <Field label="요약" required error={errors.title?.message}>
            <Input placeholder="무엇을 할 일인가요?" autoFocus {...register('title')} />
          </Field>

          <Field label="설명" error={errors.description?.message}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="상세 설명(선택) — 서식·이미지 입력 가능"
                />
              )}
            />
          </Field>

          {/* 추가 정보 — 기본 접힘. "만들기는 가볍게" 원칙: 필수 3개 뒤엔 선택 필드를 숨겨 화면을 라이트하게. */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {moreOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            추가 정보 (담당자·우선순위·Epic·마감일·라벨)
          </button>

          <div className={moreOpen ? 'space-y-3' : 'hidden'}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="담당자">
              <Controller
                control={control}
                name="assigneeId"
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="미배정" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>미배정</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="우선순위">
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value || 'MEDIUM'} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Epic 연결">
              <Controller
                control={control}
                name="epicId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={field.onChange}
                    disabled={!selectedProjectId || epics.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={epics.length ? '연결 안 함' : 'Epic 없음'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>연결 안 함</SelectItem>
                      {epics.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.key} · {e.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="마감일">
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => (
                  <DatePicker
                    className="w-full"
                    placeholder="마감일(선택)"
                    value={fromIso(field.value)}
                    onChange={(d) => field.onChange(toIso(d))}
                  />
                )}
              />
            </Field>
          </div>

          <Field label="라벨">
            <Input placeholder="콤마로 구분(예: 긴급, 인프라)" {...register('labels')} />
          </Field>
          </div>

          <DialogFooter className="items-center justify-between sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={keepOpen}
                onCheckedChange={(v) => setKeepOpen(v === true)}
              />
              다른 항목 만들기
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={close}>
                취소
              </Button>
              <Button type="submit" variant="primary" disabled={busy}>
                {busy && <Spinner className="size-4" />}
                <Plus className="size-4" /> 만들기
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
