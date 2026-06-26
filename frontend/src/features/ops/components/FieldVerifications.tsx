// 현장검증 섹션 (WMP-OPS-004) — 업무 상세에 노출(운영형 업무). 기록 목록 + 기록 추가 다이얼로그.
// 추가 시 result(PASS/FAIL/PARTIAL) + 검증자/검증일 필수. 발견이슈→후속 업무 자동 생성 옵션.
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button, Badge, Spinner, Input, Textarea, Switch, DatePicker,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { Plus, ClipboardCheck } from 'lucide-react';
import { Field } from '@/components/common/field';
import { fmtDate } from '@/lib/date';
import type { WorkItemResponse } from '@/types/domain';
import { useVerifications, useCreateVerification } from '../hooks';
import type { VerificationResult, VerificationCreateRequest } from '../api';

const RESULT_LABEL: Record<VerificationResult, string> = { PASS: '통과', FAIL: '실패', PARTIAL: '부분' };
const RESULT_BADGE: Record<VerificationResult, 'success' | 'destructive' | 'warning'> = {
  PASS: 'success', FAIL: 'destructive', PARTIAL: 'warning',
};

export function FieldVerifications({ item }: { item: WorkItemResponse }) {
  const { data: records = [], isPending } = useVerifications(item.id);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ClipboardCheck className="size-4" /> 현장검증
        </h2>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> 기록 추가
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-muted-foreground">현장검증 기록이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {records.map((r) => (
            <li key={r.id} className="px-3 py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={RESULT_BADGE[r.result]}>{RESULT_LABEL[r.result] ?? r.result}</Badge>
                <span className="font-medium">{r.verifier}</span>
                <span className="text-muted-foreground">· {fmtDate(r.verifiedDate)}</span>
                {r.location && <span className="text-muted-foreground">· {r.location}</span>}
              </div>
              {r.testContent && <p className="mt-1 text-muted-foreground">{r.testContent}</p>}
              {r.issuesFound && (
                <p className="mt-1 text-destructive">발견 이슈: {r.issuesFound}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <AddVerificationDialog item={item} open={addOpen} onOpenChange={setAddOpen} />
    </section>
  );
}

const schema = z.object({
  verifier: z.string().trim().min(1, '검증자를 입력하세요.'),
  verifiedDate: z.string().min(1, '검증일을 선택하세요.'),
  location: z.string().trim().optional(),
  environment: z.string().trim().optional(),
  testContent: z.string().trim().optional(),
  result: z.enum(['PASS', 'FAIL', 'PARTIAL']),
  issuesFound: z.string().trim().optional(),
  createFollowUp: z.boolean(),
});
type FormValues = z.input<typeof schema>;

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

function AddVerificationDialog({ item, open, onOpenChange }: {
  item: WorkItemResponse;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateVerification(item.id);
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      verifier: '', verifiedDate: toIso(new Date()), location: '', environment: '',
      testContent: '', result: 'PASS', issuesFound: '', createFollowUp: false,
    },
  });

  useEffect(() => {
    if (open) reset({
      verifier: '', verifiedDate: toIso(new Date()), location: '', environment: '',
      testContent: '', result: 'PASS', issuesFound: '', createFollowUp: false,
    });
  }, [open, reset]);

  const result = watch('result');
  const createFollowUp = watch('createFollowUp');

  const submit = handleSubmit((v) => {
    const body: VerificationCreateRequest = {
      verifier: v.verifier.trim(),
      verifiedDate: v.verifiedDate,
      location: v.location?.trim() || null,
      environment: v.environment?.trim() || null,
      testContent: v.testContent?.trim() || null,
      result: v.result,
      issuesFound: v.issuesFound?.trim() || null,
      createFollowUp: v.createFollowUp,
    };
    create.mutate(body, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!create.isPending) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>현장검증 기록</DialogTitle>
          <DialogDescription>검증 결과를 기록합니다. 발견 이슈는 후속 업무로 생성할 수 있습니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="검증자" required error={errors.verifier?.message}>
              <Input placeholder="이름" {...register('verifier')} />
            </Field>
            <Field label="검증일" required error={errors.verifiedDate?.message}>
              <Controller
                control={control}
                name="verifiedDate"
                render={({ field }) => (
                  <DatePicker value={fromIso(field.value)} onChange={(d) => field.onChange(toIso(d))} placeholder="검증일" />
                )}
              />
            </Field>
          </div>

          <Field label="결과" required error={errors.result?.message}>
            <Controller
              control={control}
              name="result"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['PASS', 'PARTIAL', 'FAIL'] as const).map((r) => (
                      <SelectItem key={r} value={r}>{RESULT_LABEL[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="장소" error={errors.location?.message}>
              <Input placeholder="(선택)" {...register('location')} />
            </Field>
            <Field label="환경" error={errors.environment?.message}>
              <Input placeholder="(선택)" {...register('environment')} />
            </Field>
          </div>

          <Field label="검증 내용" error={errors.testContent?.message}>
            <Textarea rows={2} placeholder="(선택) 무엇을 검증했는지" {...register('testContent')} />
          </Field>

          {result !== 'PASS' && (
            <Field label="발견 이슈" error={errors.issuesFound?.message}>
              <Textarea rows={2} placeholder="발견된 문제" {...register('issuesFound')} />
            </Field>
          )}

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm text-foreground">발견 이슈를 후속 업무(BUG)로 생성</span>
            <Controller
              control={control}
              name="createFollowUp"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>
          {createFollowUp && (
            <p className="text-xs text-muted-foreground">
              발견 이슈가 같은 프로젝트에 BUG로 생성되고, 이 업무와 RELATES_TO로 연결됩니다.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={create.isPending} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending && <Spinner className="size-4" />}
              기록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
