// 백로그 전환 (WMP-OPS-003) — 현장 이슈(운영형 업무)를 개발 백로그 항목으로 전환.
// 대상 개발 프로젝트 + 신규 항목 유형/제목 지정. 원본↔신규 RELATES_TO 자동 연결(BE).
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button, Spinner, Input, Textarea,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@therecommerce/ds-ui';
import { ArrowUpRight } from 'lucide-react';
import { Field } from '@/components/common/field';
import { ISSUE_TYPE_LABEL, type IssueType, type WorkItemResponse } from '@/types/domain';
import { usePromoteToBacklog } from '../hooks';

// 백로그 전환 대상 유형(BE 기본 STORY).
const PROMOTE_TYPES: IssueType[] = ['STORY', 'TASK', 'BUG'];

const schema = z.object({
  targetProjectId: z.string().optional(),     // 빈값 = 원본 프로젝트
  issueType: z.string().min(1),
  title: z.string().trim().optional(),        // 빈값 = 원본 title
  description: z.string().trim().optional(),
});
type FormValues = z.input<typeof schema>;

export function PromoteToBacklog({ item }: { item: WorkItemResponse }) {
  const promote = usePromoteToBacklog(item.id);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { targetProjectId: '', issueType: 'STORY', title: '', description: '' },
  });

  useEffect(() => {
    if (open) reset({ targetProjectId: '', issueType: 'STORY', title: '', description: '' });
  }, [open, reset]);

  const submit = handleSubmit((v) => {
    const pid = (v.targetProjectId ?? '').trim();
    promote.mutate(
      {
        targetProjectId: pid ? Number(pid) : null,
        issueType: v.issueType,
        title: v.title?.trim() || null,
        description: v.description?.trim() || null,
      },
      { onSuccess: () => setOpen(false) },
    );
  });

  return (
    <section>
      <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2.5">
        <span className="text-sm text-muted-foreground">현장 이슈를 개발 백로그로 전환</span>
        <Button variant="secondary" size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <ArrowUpRight className="size-4" /> 백로그 전환
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!promote.isPending) setOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>백로그로 전환</DialogTitle>
            <DialogDescription>
              개발 프로젝트에 신규 항목을 만들고 이 업무와 RELATES_TO로 연결합니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3">
            <Field label="대상 개발 프로젝트 ID(비우면 원본 프로젝트)" error={errors.targetProjectId?.message}>
              <Input type="number" min={1} placeholder={`기본: #${item.projectId}`} {...register('targetProjectId')} />
            </Field>

            <Field label="신규 항목 유형" required error={errors.issueType?.message}>
              <Controller
                control={control}
                name="issueType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROMOTE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{ISSUE_TYPE_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="제목(비우면 원본 제목 사용)" error={errors.title?.message}>
              <Input placeholder={item.title} {...register('title')} />
            </Field>
            <Field label="설명" error={errors.description?.message}>
              <Textarea rows={2} placeholder="(선택)" {...register('description')} />
            </Field>

            <DialogFooter>
              <Button type="button" variant="ghost" disabled={promote.isPending} onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" variant="primary" disabled={promote.isPending}>
                {promote.isPending && <Spinner className="size-4" />}
                전환
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
