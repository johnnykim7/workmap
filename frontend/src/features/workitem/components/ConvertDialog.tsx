// 유형 전환 다이얼로그 (WMP-WI-014) — 업무 유형 변경 + 부모/Epic 재지정. PATCH /work-items/{id}/convert.
// 계층 정합성(BIZ-103)은 BE가 검증. 여기선 대상 유형 선택 + 선택적 parentId/epicId 입력.
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
import { ISSUE_TYPE_LABEL, type IssueType, type WorkItemResponse } from '@/types/domain';
import { TypeOption } from '@/components/badges';
import { useConvert } from '../hooks';

const ISSUE_TYPES = Object.keys(ISSUE_TYPE_LABEL) as IssueType[];

const schema = z.object({
  issueType: z.string().min(1, '전환할 유형을 선택하세요.'),
  parentId: z.string().optional(),
  epicId: z.string().optional(),
});
type FormValues = z.input<typeof schema>;

interface Props {
  item: WorkItemResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertDialog({ item, open, onOpenChange }: Props) {
  const convert = useConvert(item.id, item.key);
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { issueType: item.issueType, parentId: '', epicId: '' },
  });

  useEffect(() => {
    if (open) reset({ issueType: item.issueType, parentId: '', epicId: '' });
  }, [open, item.issueType, reset]);

  const targetType = watch('issueType');

  const submit = handleSubmit((v) => {
    const parent = (v.parentId ?? '').trim();
    const epic = (v.epicId ?? '').trim();
    convert.mutate(
      {
        issueType: v.issueType,
        parentId: parent ? Number(parent) : null,
        epicId: epic ? Number(epic) : null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!convert.isPending) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>유형 전환</DialogTitle>
          <DialogDescription>
            현재 유형: {ISSUE_TYPE_LABEL[item.issueType]}. 전환 시 계층 정합성(BIZ-103)을 서버가 검증합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="전환할 유형" required error={errors.issueType?.message}>
            <Controller
              control={control}
              name="issueType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}><TypeOption type={t} /></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {/* Sub-task 전환 시 부모 지정 안내, Story/Task 등은 Epic 연결 가능 */}
          {targetType === 'SUBTASK' && (
            <Field label="부모 업무 ID(parentId)" error={errors.parentId?.message}>
              <Input type="number" min={1} placeholder="부모로 둘 업무 id" {...register('parentId')} />
            </Field>
          )}
          {targetType !== 'EPIC' && targetType !== 'SUBTASK' && (
            <Field label="Epic 연결 ID(epicId, 선택)" error={errors.epicId?.message}>
              <Input type="number" min={1} placeholder="연결할 Epic id" {...register('epicId')} />
            </Field>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={convert.isPending} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={convert.isPending}>
              {convert.isPending && <Spinner className="size-4" />}
              전환
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
