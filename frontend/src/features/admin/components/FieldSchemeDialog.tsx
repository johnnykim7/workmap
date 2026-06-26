// 필드 스킴 생성/수정 다이얼로그 (WMP-ADM-002) — ds-ui Dialog + RHF + Zod.
// projectId 비우면 전역 기본 스킴. 유형별 필드 노출(isVisible)/필수(isRequired) 정의(POL-006).
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
import { ISSUE_TYPE_LABEL, type IssueType } from '@/types/domain';
import type { FieldSchemeRequest, FieldSchemeResponse } from '../api';

const ISSUE_TYPES = Object.keys(ISSUE_TYPE_LABEL) as IssueType[];

const schema = z.object({
  projectId: z.string().optional(),                 // 빈 문자열 = 전역
  issueTypeCode: z.string().min(1, '업무 유형을 선택하세요.'),
  fieldKey: z.string().trim().min(1, '필드 키를 입력하세요.').max(40),
  isVisible: z.boolean(),
  isRequired: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editing?: FieldSchemeResponse | null;
  onSubmit: (body: FieldSchemeRequest) => void;
}

export function FieldSchemeDialog({ open, onOpenChange, busy = false, editing, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: '', issueTypeCode: 'TASK', fieldKey: '', isVisible: true, isRequired: false, sortOrder: 0 },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            projectId: editing.projectId != null ? String(editing.projectId) : '',
            issueTypeCode: editing.issueTypeCode,
            fieldKey: editing.fieldKey,
            isVisible: editing.isVisible,
            isRequired: editing.isRequired,
            sortOrder: editing.sortOrder,
          }
        : { projectId: '', issueTypeCode: 'TASK', fieldKey: '', isVisible: true, isRequired: false, sortOrder: 0 },
    );
  }, [open, editing, reset]);

  const submit = handleSubmit((v) => {
    const pid = (v.projectId ?? '').trim();
    onSubmit({
      projectId: pid ? Number(pid) : null,
      issueTypeCode: v.issueTypeCode,
      fieldKey: v.fieldKey.trim(),
      isVisible: v.isVisible,
      isRequired: v.isRequired,
      sortOrder: v.sortOrder == null ? 0 : Number(v.sortOrder),
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '필드 스킴 수정' : '필드 스킴 추가'}</DialogTitle>
          <DialogDescription>유형별 필드 노출·필수 여부를 정의합니다(POL-006).</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="프로젝트 ID(비우면 전역 기본)" error={errors.projectId?.message}>
            <Input type="number" min={1} placeholder="전역 기본" {...register('projectId')} />
          </Field>

          <Field label="업무 유형" required error={errors.issueTypeCode?.message}>
            <Controller
              control={control}
              name="issueTypeCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{ISSUE_TYPE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="필드 키" required error={errors.fieldKey?.message}>
            <Input placeholder="예: priority, dueDate, assignee" {...register('fieldKey')} />
          </Field>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">노출(isVisible)</span>
            <Controller
              control={control}
              name="isVisible"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">필수(isRequired)</span>
            <Controller
              control={control}
              name="isRequired"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
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
