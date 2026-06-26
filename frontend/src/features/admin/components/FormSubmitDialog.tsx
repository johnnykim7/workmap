// 양식 제출 테스트 다이얼로그 (WMP-ADM-005) — 양식 정의(project/issueType)로 work_item 생성.
// 관리자 빌더 화면에서 양식 동작을 즉석 검증하는 용도. 제출 성공 시 생성 업무 key 토스트.
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Spinner,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import type { FormResponse, FormSubmitRequest } from '../api';

const schema = z.object({
  title: z.string().trim().min(1, '제목을 입력하세요.').max(300),
  description: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  form: FormResponse | null;
  onSubmit: (body: FormSubmitRequest) => void;
}

export function FormSubmitDialog({ open, onOpenChange, busy = false, form, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => { if (open) reset({ title: '', description: '' }); }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>양식 제출 테스트</DialogTitle>
          <DialogDescription>
            {form ? `'${form.name}' 양식으로 업무를 생성합니다.` : ''}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => onSubmit({ title: v.title.trim(), description: v.description?.trim() || null }))}
          className="space-y-3"
        >
          <Field label="제목" required error={errors.title?.message}>
            <Input placeholder="생성할 업무 제목" {...register('title')} />
          </Field>
          <Field label="설명" error={errors.description?.message}>
            <Textarea rows={3} placeholder="(선택) 설명" {...register('description')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              제출
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
