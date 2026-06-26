// 측정 단위 생성/수정 다이얼로그 (WMP-ADM-001) — ds-ui Dialog + RHF + Zod.
// valueType=SELECT일 때만 옵션(쉼표 구분) 노출. 시스템 단위는 화면에서 편집/삭제 막음(페이지에서 가드).
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
import type { MeasureUnitRequest, MeasureUnitResponse, MeasureValueType } from '../api';

const schema = z.object({
  name: z.string().trim().min(1, '이름을 입력하세요.').max(40),
  valueType: z.enum(['NUMBER', 'BOOLEAN', 'SELECT']),
  suffix: z.string().trim().max(20).optional(),
  optionsText: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
}).refine(
  (v) => v.valueType !== 'SELECT' || (v.optionsText ?? '').split(',').map((s) => s.trim()).filter(Boolean).length > 0,
  { message: 'SELECT 유형은 옵션을 1개 이상 입력하세요.', path: ['optionsText'] },
);

type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  /** 수정 대상(없으면 생성) */
  editing?: MeasureUnitResponse | null;
  onSubmit: (body: MeasureUnitRequest) => void;
}

const VALUE_TYPE_LABEL: Record<MeasureValueType, string> = {
  NUMBER: '숫자',
  BOOLEAN: '예/아니오',
  SELECT: '선택지',
};

export function MeasureUnitDialog({ open, onOpenChange, busy = false, editing, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { name: '', valueType: 'NUMBER', suffix: '', optionsText: '', sortOrder: 0 },
    });

  // 다이얼로그가 열릴 때 편집 대상 값으로 채움(생성이면 초기화).
  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            valueType: editing.valueType,
            suffix: editing.suffix ?? '',
            optionsText: (editing.options ?? []).join(', '),
            sortOrder: editing.sortOrder,
          }
        : { name: '', valueType: 'NUMBER', suffix: '', optionsText: '', sortOrder: 0 },
    );
  }, [open, editing, reset]);

  const valueType = watch('valueType');

  const submit = handleSubmit((v) => {
    onSubmit({
      name: v.name,
      valueType: v.valueType,
      suffix: v.suffix?.trim() || null,
      options:
        v.valueType === 'SELECT'
          ? (v.optionsText ?? '').split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      sortOrder: v.sortOrder == null ? 0 : Number(v.sortOrder),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '측정 단위 수정' : '측정 단위 추가'}</DialogTitle>
          <DialogDescription>측정값의 이름·유형·단위를 정의합니다(POL-005).</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="예: 진척률" {...register('name')} />
          </Field>

          <Field label="값 유형" required error={errors.valueType?.message}>
            <Controller
              control={control}
              name="valueType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['NUMBER', 'BOOLEAN', 'SELECT'] as const).map((t) => (
                      <SelectItem key={t} value={t}>{VALUE_TYPE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {valueType === 'NUMBER' && (
            <Field label="단위 표기(suffix)" error={errors.suffix?.message}>
              <Input placeholder="예: %, 시간, 건" {...register('suffix')} />
            </Field>
          )}

          {valueType === 'SELECT' && (
            <Field label="옵션(쉼표로 구분)" required error={errors.optionsText?.message}>
              <Input placeholder="예: 낮음, 보통, 높음" {...register('optionsText')} />
            </Field>
          )}

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
