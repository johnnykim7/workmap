// 워크플로 생성/이름수정 다이얼로그 (WMP-ADM-003) — 이름만 입력.
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Spinner,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import type { WorkflowRequest, WorkflowResponse } from '../api';

const schema = z.object({ name: z.string().trim().min(1, '이름을 입력하세요.').max(60) });
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editing?: WorkflowResponse | null;
  onSubmit: (body: WorkflowRequest) => void;
}

export function WorkflowNameDialog({ open, onOpenChange, busy = false, editing, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) reset({ name: editing?.name ?? '' });
  }, [open, editing, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? '워크플로 이름 수정' : '워크플로 추가'}</DialogTitle>
          <DialogDescription>상태/전이 화이트리스트의 집합입니다(POL-001).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => onSubmit({ name: v.name.trim() }))} className="space-y-3">
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="예: 개발 표준 워크플로" {...register('name')} />
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
