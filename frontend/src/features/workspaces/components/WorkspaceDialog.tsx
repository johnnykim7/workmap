// 워크스페이스 생성/수정 다이얼로그 (WMP-WS-001) — ds-ui Dialog + RHF + Zod.
// 생성/수정은 Admin/Owner 전용(BE @PreAuthorize). 진입 가드는 호출부(페이지)에서.
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Textarea, Spinner,
} from '@therecommerce/ds-ui';
import { Field } from '@/components/common/field';
import type { Workspace } from '@/types/domain';
import type { WorkspaceRequest } from '../api';

const schema = z.object({
  name: z.string().trim().min(1, '이름을 입력하세요.').max(150),
  description: z.string().trim().max(2000).optional(),
});
type FormValues = z.input<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editing?: Workspace | null;
  onSubmit: (body: WorkspaceRequest) => void;
}

export function WorkspaceDialog({ open, onOpenChange, busy = false, editing, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset(editing
      ? { name: editing.name, description: editing.description ?? '' }
      : { name: '', description: '' });
  }, [open, editing, reset]);

  const submit = handleSubmit((v) => {
    onSubmit({ name: v.name.trim(), description: v.description?.trim() || undefined });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '워크스페이스 수정' : '워크스페이스 만들기'}</DialogTitle>
          <DialogDescription>
            워크스페이스는 프로젝트를 담는 최상위 묶음입니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Field label="이름" required error={errors.name?.message}>
            <Input placeholder="예: 물류 플랫폼" autoFocus {...register('name')} />
          </Field>
          <Field label="설명" error={errors.description?.message}>
            <Textarea rows={3} placeholder="워크스페이스 설명(선택)" {...register('description')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && <Spinner className="size-4" />}
              {editing ? '수정' : '만들기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
