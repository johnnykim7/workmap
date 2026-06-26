// 워크플로 상태 추가 다이얼로그 (WMP-ADM-003) — ds-ui Dialog + RHF + Zod.
// code/label/commonStatus 필수. 시작/완료/승인 플래그 + 승인역할(승인 상태일 때).
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Switch, Spinner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { WORK_STATUS_LABEL, type WorkStatus } from '@/types/domain';
import type { WorkflowStatusRequest } from '../api';

const COMMON_STATUSES = Object.keys(WORK_STATUS_LABEL) as WorkStatus[];

const schema = z.object({
  code: z.string().trim().min(1, '코드를 입력하세요.').max(40),
  label: z.string().trim().min(1, '라벨을 입력하세요.').max(40),
  commonStatus: z.string().min(1, '공통 상태를 선택하세요.'),
  isStart: z.boolean(),
  isDone: z.boolean(),
  isApproval: z.boolean(),
  approverRole: z.string().trim().max(20).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  onSubmit: (body: WorkflowStatusRequest) => void;
}

export function WorkflowStatusDialog({ open, onOpenChange, busy = false, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '', label: '', commonStatus: 'TODO',
      isStart: false, isDone: false, isApproval: false, approverRole: '', sortOrder: 0,
    },
  });

  useEffect(() => { if (open) reset(); }, [open, reset]);

  const isApproval = watch('isApproval');

  const submit = handleSubmit((v) => {
    onSubmit({
      code: v.code.trim(),
      label: v.label.trim(),
      commonStatus: v.commonStatus,
      isStart: v.isStart,
      isDone: v.isDone,
      isApproval: v.isApproval,
      approverRole: v.isApproval ? (v.approverRole?.trim() || null) : null,
      sortOrder: v.sortOrder == null ? 0 : Number(v.sortOrder),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>상태 추가</DialogTitle>
          <DialogDescription>워크플로에 새 상태를 추가합니다(POL-001).</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="코드" required error={errors.code?.message}>
              <Input placeholder="예: IN_REVIEW" {...register('code')} />
            </Field>
            <Field label="라벨" required error={errors.label?.message}>
              <Input placeholder="예: 검토중" {...register('label')} />
            </Field>
          </div>

          <Field label="공통 상태" required error={errors.commonStatus?.message}>
            <Controller
              control={control}
              name="commonStatus"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{WORK_STATUS_LABEL[s]} ({s})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <Flag control={control} name="isStart" label="시작" />
            <Flag control={control} name="isDone" label="완료" />
            <Flag control={control} name="isApproval" label="승인" />
          </div>

          {isApproval && (
            <Field label="승인 역할" error={errors.approverRole?.message}>
              <Input placeholder="예: MANAGER, OWNER" {...register('approverRole')} />
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
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Flag({ control, name, label }: { control: any; name: 'isStart' | 'isDone' | 'isApproval'; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
      />
    </div>
  );
}
