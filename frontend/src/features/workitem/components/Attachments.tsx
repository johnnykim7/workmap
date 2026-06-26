// 첨부 섹션 (WMP-WI-012, §9.3) — 파일 메타데이터(이름 + 경로/URL) 등록·목록.
// BE가 바이너리 업로드가 아닌 메타데이터 등록 방식이라(파일 경로/URL), 네이티브 file input 없이 폼으로 처리.
import { useEffect, useState, type MutableRefObject } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button, Spinner, Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@therecommerce/ds-ui';
import { Plus, Paperclip, ExternalLink } from 'lucide-react';
import { Field } from '@/components/common/field';
import { fmtDate } from '@/lib/date';
import type { WorkItemResponse } from '@/types/domain';
import { useAttachments, useCreateAttachment } from '../hooks';

export function Attachments({ item, addRef }: {
  item: WorkItemResponse;
  addRef?: MutableRefObject<() => void>;
}) {
  const { data: attachments = [], isPending } = useAttachments(item.id);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { if (addRef) addRef.current = () => setAddOpen(true); }, [addRef]);

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Paperclip className="size-4" /> 첨부
        </h2>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> 첨부 추가
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">첨부가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={a.filePath}
                target="_blank"
                rel="noreferrer noopener"
                className="flex flex-1 items-center gap-1 truncate font-medium hover:underline"
                title={a.filePath}
              >
                {a.fileName}
                <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
              </a>
              {a.contentType && <span className="shrink-0 text-xs text-muted-foreground">{a.contentType}</span>}
              <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <AddAttachmentDialog item={item} open={addOpen} onOpenChange={setAddOpen} />
    </section>
  );
}

const schema = z.object({
  fileName: z.string().trim().min(1, '파일 이름을 입력하세요.').max(255),
  filePath: z.string().trim().min(1, '경로 또는 URL을 입력하세요.'),
  contentType: z.string().trim().optional(),
});
type FormValues = z.infer<typeof schema>;

function AddAttachmentDialog({ item, open, onOpenChange }: {
  item: WorkItemResponse;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateAttachment(item.id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fileName: '', filePath: '', contentType: '' },
  });

  useEffect(() => { if (open) reset({ fileName: '', filePath: '', contentType: '' }); }, [open, reset]);

  const submit = handleSubmit((v) => {
    create.mutate(
      { fileName: v.fileName.trim(), filePath: v.filePath.trim(), contentType: v.contentType?.trim() || null },
      { onSuccess: () => onOpenChange(false) },
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!create.isPending) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>첨부 추가</DialogTitle>
          <DialogDescription>파일 경로 또는 URL을 등록합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="파일 이름" required error={errors.fileName?.message}>
            <Input placeholder="예: 설계도.pdf" {...register('fileName')} />
          </Field>
          <Field label="경로 / URL" required error={errors.filePath?.message}>
            <Input placeholder="https://… 또는 파일 경로" {...register('filePath')} />
          </Field>
          <Field label="콘텐츠 타입" error={errors.contentType?.message}>
            <Input placeholder="(선택) 예: application/pdf" {...register('contentType')} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={create.isPending} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending && <Spinner className="size-4" />}
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
