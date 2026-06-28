// 스프린트 생성 다이얼로그 — ds-ui Dialog + RHF + Zod. 네이티브 위젯 금지.
// 생성 시 status=FUTURE 고정(BE). 기간은 선택(시작 시 확정 가능).
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Spinner, DatePicker,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import type { CreateSprintRequest } from '../api';

// Date ↔ yyyy-mm-dd 문자열 변환(BE는 LocalDate 문자열). 로컬 타임존 기준.
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
    goal: z.string().trim().max(500).optional(),
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
  busy?: boolean;
  onSubmit: (body: CreateSprintRequest) => void;
}

export function CreateSprintDialog({ open, onOpenChange, busy = false, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', goal: '', startDate: '', endDate: '' },
  });

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
          <DialogTitle>스프린트 만들기</DialogTitle>
          <DialogDescription>새 스프린트는 예정(FUTURE) 상태로 생성됩니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="예: Sprint 1" {...register('name')} />
          </Field>
          <Field label="목표" error={errors.goal?.message}>
            <Textarea rows={2} placeholder="이 스프린트에서 달성할 목표" {...register('goal')} />
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
                    className="w-full"
                    placeholder="종료일 선택"
                    value={fromIso(field.value)}
                    onChange={(d) => field.onChange(toIso(d))}
                  />
                )}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
