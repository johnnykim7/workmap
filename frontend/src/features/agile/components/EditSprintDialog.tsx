// 스프린트 편집 다이얼로그(CR-038, WMP-AGL-007) — Jira식 풍부한 폼.
// ds-ui Dialog + RHF + Zod. 이름·기간 프리셋(1주/2주/3주/4주/사용자지정)·시작/종료일·목표.
// status는 편집으로 바꾸지 않음(전이는 시작/완료 전용). 어느 상태에서든 편집 가능.
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Spinner, DatePicker,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import type { Sprint } from '@/types/domain';
import type { UpdateSprintRequest } from '../api';
import { DURATION_PRESETS, type DurationPreset, endDateFor, presetFor } from '../duration';

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
    name: z.string().trim().min(1, '스프린트 이름을 입력하세요.').max(100),
    goal: z.string().trim().max(300, '목표는 300자 이내로 입력하세요.').optional(),
    preset: z.enum(['CUSTOM', '1W', '2W', '3W', '4W']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: '종료일은 시작일 이후여야 합니다.',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint | null;
  busy?: boolean;
  onSubmit: (body: UpdateSprintRequest) => void;
}

export function EditSprintDialog({ open, onOpenChange, sprint, busy = false, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { name: '', goal: '', preset: 'CUSTOM', startDate: '', endDate: '' },
    });

  // 편집 대상이 바뀌면 기존 값으로 채움 + 기간에서 프리셋 역산.
  useEffect(() => {
    if (open && sprint) {
      reset({
        name: sprint.name,
        goal: sprint.goal ?? '',
        preset: presetFor(sprint.startDate ?? undefined, sprint.endDate ?? undefined),
        startDate: sprint.startDate ?? '',
        endDate: sprint.endDate ?? '',
      });
    }
  }, [open, sprint, reset]);

  const preset = watch('preset');
  const isCustom = preset === 'CUSTOM';

  // 프리셋 또는 시작일이 바뀌면(프리셋≠CUSTOM) 종료일 자동계산.
  const recomputeEnd = (nextPreset: DurationPreset, start?: string) => {
    if (nextPreset === 'CUSTOM') return;
    const end = endDateFor(nextPreset, start);
    if (end) setValue('endDate', end, { shouldValidate: true });
  };

  const submit = handleSubmit((v) => {
    onSubmit({
      name: v.name,
      goal: v.goal || undefined,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>스프린트 편집{sprint ? `: ${sprint.name}` : ''}</DialogTitle>
          <DialogDescription>이름·기간·목표를 수정합니다. 상태는 시작/완료로만 바뀝니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="예: Sprint 1" {...register('name')} />
          </Field>

          <Field label="기간">
            <Controller
              control={control}
              name="preset"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    const p = val as DurationPreset;
                    field.onChange(p);
                    recomputeEnd(p, watch('startDate'));
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="기간 선택" /></SelectTrigger>
                  <SelectContent>
                    {DURATION_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일" error={errors.startDate?.message}>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    className="w-full"
                    placeholder="시작일 선택"
                    value={fromIso(field.value)}
                    onChange={(d) => {
                      const iso = toIso(d);
                      field.onChange(iso);
                      recomputeEnd(watch('preset'), iso);
                    }}
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
                    className="w-full"
                    placeholder="종료일 선택"
                    disabled={!isCustom}  // 프리셋 선택 시 자동계산 → 사용자지정만 직접 입력
                    value={fromIso(field.value)}
                    onChange={(d) => field.onChange(toIso(d))}
                  />
                )}
              />
            </Field>
          </div>

          <Field label="목표" error={errors.goal?.message}>
            <Textarea rows={2} placeholder="이 스프린트에서 달성할 목표" {...register('goal')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              업데이트
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
