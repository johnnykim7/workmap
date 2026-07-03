// 첨부 섹션 (WMP-WI-012, §9.3) — 실제 파일 업로드(POST /files/upload → 저장 URL) 후 첨부 등록·목록.
// 파일 선택은 숨김 <input type=file>을 ds-ui Button으로 트리거(네이티브 위젯 노출 금지 규칙 준수).
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  Button, Spinner, toast,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@therecommerce/ds-ui';
import { Plus, Paperclip, ExternalLink, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
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

const MAX_SIZE = 10 * 1024 * 1024; // BE multipart 10MB 제한과 동일.

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AddAttachmentDialog({ item, open, onOpenChange }: {
  item: WorkItemResponse;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateAttachment(item.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (open) { setPicked(null); setUploading(false); } }, [open]);

  const busy = uploading || create.isPending;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast.error('파일이 너무 큽니다(최대 10MB).');
      return;
    }
    setPicked(file);
  };

  const submit = async () => {
    if (!picked) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(picked); // POST /files/upload → 저장 URL
      setUploading(false);
      create.mutate(
        {
          fileName: uploaded.fileName,
          filePath: uploaded.url,
          fileSize: uploaded.fileSize,
          contentType: uploaded.contentType || null,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } catch (err) {
      setUploading(false);
      const msg = err instanceof Error && err.message ? err.message : '파일 업로드에 실패했습니다.';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>첨부 추가</DialogTitle>
          <DialogDescription>파일을 선택해 업로드합니다(최대 10MB).</DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onPick}
          aria-hidden
        />

        <div className="space-y-3">
          {picked ? (
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium" title={picked.name}>{picked.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{fmtSize(picked.size)}</span>
              {!busy && (
                <Button variant="ghost" size="sm" className="size-6 shrink-0 p-0" onClick={() => setPicked(null)} title="선택 해제">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:bg-muted/40"
            >
              <Upload className="size-5" />
              파일 선택
            </button>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" variant="primary" disabled={!picked || busy} onClick={submit}>
            {busy && <Spinner className="size-4" />}
            {uploading ? '업로드 중…' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
