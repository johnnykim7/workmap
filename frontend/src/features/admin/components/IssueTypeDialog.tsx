// 업무 유형 마스터 생성/수정 다이얼로그 (WMP-ADM-004) — ds-ui Dialog + RHF + Zod.
// code는 식별자라 수정 시 잠금(BE도 update에서 무시). depth 0~2 계층(BIZ-103). 시스템 유형은 페이지에서 가드.
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Spinner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import type { IssueTypeMasterRequest, IssueTypeMasterResponse } from '../api';

const DEPTH_LABEL: Record<number, string> = { 0: '0 (최상위)', 1: '1 (중간)', 2: '2 (하위)' };

const schema = z.object({
  code: z.string().trim().min(1, '코드를 입력하세요.').max(20),
  label: z.string().trim().min(1, '라벨을 입력하세요.').max(40),
  depth: z.coerce.number().int().min(0).max(2),
  color: z.string().trim().max(20).optional(),
  icon: z.string().trim().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editing?: IssueTypeMasterResponse | null;
  onSubmit: (body: IssueTypeMasterRequest) => void;
}

export function IssueTypeDialog({ open, onOpenChange, busy = false, editing, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', label: '', depth: 1, color: '', icon: '', sortOrder: 0 },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            code: editing.code,
            label: editing.label,
            depth: editing.depth,
            color: editing.color ?? '',
            icon: editing.icon ?? '',
            sortOrder: editing.sortOrder,
          }
        : { code: '', label: '', depth: 1, color: '', icon: '', sortOrder: 0 },
    );
  }, [open, editing, reset]);

  const submit = handleSubmit((v) => {
    onSubmit({
      code: v.code.trim(),
      label: v.label.trim(),
      depth: Number(v.depth),
      color: v.color?.trim() || null,
      icon: v.icon?.trim() || null,
      sortOrder: v.sortOrder == null ? 0 : Number(v.sortOrder),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '업무 유형 수정' : '업무 유형 추가'}</DialogTitle>
          <DialogDescription>업무 유형 카탈로그를 정의합니다(BIZ-103 계층 정합성).</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="코드" required error={errors.code?.message}>
              <Input placeholder="예: INCIDENT" disabled={!!editing} {...register('code')} />
            </Field>
            <Field label="라벨" required error={errors.label?.message}>
              <Input placeholder="예: 장애" {...register('label')} />
            </Field>
          </div>

          <Field label="계층 깊이(depth)" required error={errors.depth?.message}>
            <Controller
              control={control}
              name="depth"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map((d) => (
                      <SelectItem key={d} value={String(d)}>{DEPTH_LABEL[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="색상(토큰/hex)" error={errors.color?.message}>
              <Input placeholder="예: red, #ef4444" {...register('color')} />
            </Field>
            <Field label="아이콘(이름)" error={errors.icon?.message}>
              <Input placeholder="예: bug" {...register('icon')} />
            </Field>
          </div>

          <Field label="정렬 순서" error={errors.sortOrder?.message}>
            <Input type="number" min={0} {...register('sortOrder')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              {editing ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
