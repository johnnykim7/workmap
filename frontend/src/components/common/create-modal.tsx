// 전역 [만들기] 모달 (§9.4 업무 만들기, WMP-WI-001) — ds-ui Dialog + RHF + Zod.
// "만들기는 가볍게": 필수=프로젝트·유형·요약 / 선택=설명·담당자·우선순위·라벨·Epic.
// 유형별 풍부한 필드(인수조건/재현절차 등)는 모달에 없음 — 만든 뒤 상세에서 채움(§9.3).
// 상태는 BE가 워크플로 시작 상태로 고정(status_id 입력 무시, WI-3).
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Spinner, Checkbox,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Plus } from 'lucide-react';
import { Field } from './field';
import { useUiStore } from '@/store/ui-store';
import { useProjects } from '@/features/projects/hooks';
import { useMembers } from '@/features/members/hooks';
import { useCreateWorkItem } from '@/features/workitem/hooks';
import { workItemApi } from '@/features/workitem/api';
import {
  ISSUE_TYPE_LABEL, PRIORITY_LABEL, PROJECT_TEMPLATES,
  type IssueType, type Priority,
} from '@/types/domain';
import { ROUTES } from '@/lib/route-paths';

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
} as const;

export function CreateModal() {
  const open = useUiStore((s) => s.createModalOpen);
  const close = useUiStore((s) => s.closeCreateModal);
  const navigate = useNavigate();
  const [keepOpen, setKeepOpen] = useState(false);

  const { data: projects = [] } = useProjects({});
  const createMut = useCreateWorkItem();

  const { register, handleSubmit, reset, control, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { ...EMPTY },
    });

  // 모달이 닫히면 폼 초기화.
  useEffect(() => {
    if (!open) reset({ ...EMPTY });
  }, [open, reset]);

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
      },
      {
        onSuccess: (created) => {
          if (keepOpen) {
            // 연속 생성: 프로젝트·유형은 유지하고 요약/설명/라벨만 비움.
            reset({
              ...EMPTY,
              projectId: created.projectId as unknown as undefined,
              issueType: created.issueType,
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
                        <SelectItem key={t} value={t}>{ISSUE_TYPE_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field label="요약" required error={errors.title?.message}>
            <Input placeholder="무엇을 할 일인가요?" autoFocus {...register('title')} />
          </Field>

          <Field label="설명" error={errors.description?.message}>
            <Textarea rows={3} placeholder="상세 설명(선택)" {...register('description')} />
          </Field>

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
