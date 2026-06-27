// 프로젝트 설정 다이얼로그 (WMP-WS-004 수정/보관 + WMP-WS-006 가시성) — ds-ui Dialog + RHF + Zod.
// 한 곳에서 이름·기간·설명·탭 조합 수정 + 가시성 토글 + 보관(파괴) 처리.
// 가시성/보관은 BE 전용 엔드포인트라 즉시 반영(폼 저장과 별개 액션).
// 진입 가드(Manager 이상)는 호출부에서. ds-ui만 사용(네이티브 위젯 금지).
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Spinner, Switch, Checkbox, DatePicker,
} from '@therecommerce/ds-ui';
import { Archive } from 'lucide-react';
import { Field } from '@/components/common/field';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  PROJECT_TAB_LABEL, VISIBILITY_LABEL,
  type Project, type Visibility,
} from '@/types/domain';
import {
  useUpdateProject, useArchiveProject, useChangeProjectVisibility,
} from '../hooks';
import type { UpdateProjectRequest } from '../api';

// 탭 후보 전체(§7). summary는 항상 포함(요약 비활성 금지).
const ALL_TABS = ['summary', 'list', 'board', 'backlog', 'timeline', 'calendar', 'approvals', 'reports'] as const;

function toIso(d?: Date): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fromIso(s?: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

const schema = z
  .object({
    name: z.string().trim().min(1, '이름을 입력하세요.').max(200),
    description: z.string().trim().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    activeTabs: z.array(z.string()).min(1, '탭을 하나 이상 선택하세요.'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: '종료일은 시작일 이후여야 합니다.',
    path: ['endDate'],
  });
type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function ProjectSettingsDialog({ open, onOpenChange, project }: Props) {
  const updateMut = useUpdateProject();
  const archiveMut = useArchiveProject();
  const visibilityMut = useChangeProjectVisibility();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', startDate: '', endDate: '', activeTabs: ['summary'] },
  });

  useEffect(() => {
    if (!open || !project) return;
    reset({
      name: project.name,
      description: project.description ?? '',
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      activeTabs: project.activeTabs?.length ? project.activeTabs : ['summary'],
    });
  }, [open, project, reset]);

  if (!project) return null;

  const submit = handleSubmit((v) => {
    const body: UpdateProjectRequest = {
      name: v.name.trim(),
      description: v.description?.trim() || null,
      startDate: v.startDate || null,
      endDate: v.endDate || null,
      activeTabs: v.activeTabs,
    };
    updateMut.mutate({ id: project.id, body }, { onSuccess: () => onOpenChange(false) });
  });

  const isPrivate = project.visibility === 'PRIVATE';
  const toggleVisibility = (priv: boolean) => {
    const next: Visibility = priv ? 'PRIVATE' : 'PUBLIC';
    if (next === project.visibility) return;
    visibilityMut.mutate({ id: project.id, visibility: next });
  };

  const busy = updateMut.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>프로젝트 설정</DialogTitle>
            <DialogDescription>{project.key} · 이름·기간·탭·가시성을 변경합니다.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3">
            <Field label="이름" required error={errors.name?.message}>
              <Input {...register('name')} />
            </Field>

            <Field label="설명" error={errors.description?.message}>
              <Textarea rows={2} placeholder="프로젝트 설명(선택)" {...register('description')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="시작일" error={errors.startDate?.message}>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      placeholder="시작일 선택"
                      value={fromIso(field.value)}
                      onChange={(d) => field.onChange(toIso(d))}
                    />
                  )}
                />
              </Field>
              <Field label="종료일" error={errors.endDate?.message}>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      placeholder="종료일 선택"
                      value={fromIso(field.value)}
                      onChange={(d) => field.onChange(toIso(d))}
                    />
                  )}
                />
              </Field>
            </div>

            <Field label="노출 탭" error={errors.activeTabs?.message}>
              <Controller
                control={control}
                name="activeTabs"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ALL_TABS.map((tab) => {
                      const checked = field.value.includes(tab);
                      const locked = tab === 'summary'; // 요약은 항상 노출
                      return (
                        <label key={tab} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            disabled={locked}
                            onCheckedChange={(v) => {
                              if (locked) return;
                              const set = new Set(field.value);
                              if (v === true) set.add(tab);
                              else set.delete(tab);
                              field.onChange(ALL_TABS.filter((t) => set.has(t)));
                            }}
                          />
                          {PROJECT_TAB_LABEL[tab]}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </Field>

            {/* 가시성 — 전용 엔드포인트라 토글 즉시 반영(WMP-WS-006) */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium text-foreground">비공개</div>
                <div className="text-xs text-muted-foreground">
                  현재: {VISIBILITY_LABEL[project.visibility]} ·{' '}
                  {isPrivate ? '멤버만 볼 수 있습니다.' : '워크스페이스 전체에 공개됩니다.'}
                </div>
              </div>
              <Switch
                checked={isPrivate}
                disabled={visibilityMut.isPending}
                onCheckedChange={toggleVisibility}
              />
            </div>

            <DialogFooter className="items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                disabled={busy || archiveMut.isPending}
                onClick={() => setConfirmArchive(true)}
              >
                <Archive className="size-4" /> 보관
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  {busy && <Spinner className="size-4" />}
                  저장
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="프로젝트를 보관할까요?"
        description={`"${project.name}"를 보관하면 기본 목록에서 숨겨집니다. (소프트 보관 — 데이터는 유지)`}
        confirmLabel="보관"
        busy={archiveMut.isPending}
        onConfirm={() =>
          archiveMut.mutate(project.id, {
            onSuccess: () => { setConfirmArchive(false); onOpenChange(false); },
          })
        }
      />
    </>
  );
}
