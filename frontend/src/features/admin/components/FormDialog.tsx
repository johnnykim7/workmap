// 양식 생성/수정 다이얼로그 (WMP-ADM-005) — ds-ui Dialog + RHF + Zod.
// fields는 JSONB 원본(필드 배치/도움말/필수)을 Textarea로 직접 편집 — JSON 파싱 검증.
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Switch, Spinner,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import { ISSUE_TYPE_LABEL, type IssueType } from '@/types/domain';
import type { FormRequest, FormResponse } from '../api';

const ISSUE_TYPES = Object.keys(ISSUE_TYPE_LABEL) as IssueType[];

const DEFAULT_FIELDS = JSON.stringify(
  { fields: [{ key: 'priority', label: '우선순위', required: false }] },
  null,
  2,
);

const schema = z.object({
  projectId: z.coerce.number().int().positive('프로젝트 ID를 입력하세요.'),
  issueTypeCode: z.string().min(1, '업무 유형을 선택하세요.'),
  name: z.string().trim().min(1, '이름을 입력하세요.').max(100),
  fields: z.string().refine((s) => {
    try { JSON.parse(s); return true; } catch { return false; }
  }, 'fields는 올바른 JSON이어야 합니다.'),
  isPublic: z.boolean(),
});

type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editing?: FormResponse | null;
  onSubmit: (body: FormRequest) => void;
}

export function FormDialog({ open, onOpenChange, busy = false, editing, onSubmit }: Props) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: undefined, issueTypeCode: 'TASK', name: '', fields: DEFAULT_FIELDS, isPublic: false },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            projectId: editing.projectId,
            issueTypeCode: editing.issueTypeCode,
            name: editing.name,
            fields: prettyJson(editing.fields),
            isPublic: editing.isPublic,
          }
        : { projectId: undefined, issueTypeCode: 'TASK', name: '', fields: DEFAULT_FIELDS, isPublic: false },
    );
  }, [open, editing, reset]);

  const submit = handleSubmit((v) => {
    onSubmit({
      projectId: Number(v.projectId),
      issueTypeCode: v.issueTypeCode,
      name: v.name.trim(),
      fields: v.fields,
      isPublic: v.isPublic,
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? '양식 수정' : '양식 추가'}</DialogTitle>
          <DialogDescription>양식 제출 시 생성될 업무 유형·필드 배치를 정의합니다(WMP-ADM-005).</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="프로젝트 ID" required error={errors.projectId?.message}>
              <Input type="number" min={1} placeholder="예: 12" {...register('projectId')} />
            </Field>
            <Field label="생성 업무 유형" required error={errors.issueTypeCode?.message}>
              <Controller
                control={control}
                name="issueTypeCode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{ISSUE_TYPE_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field label="양식 이름" required error={errors.name?.message}>
            <Input placeholder="예: 버그 신고 양식" {...register('name')} />
          </Field>

          <Field label="필드 정의(JSON)" required error={errors.fields?.message}>
            <Textarea rows={8} className="font-mono text-xs" {...register('fields')} />
          </Field>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">공개(isPublic) — 인증 사용자 누구나 제출</span>
            <Controller
              control={control}
              name="isPublic"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>

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

function prettyJson(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
}
