// 업무 첨부 섹션 (WMP-WI-012, §9.3, CR-037) — 공통 FileAttachmentList에 work_item 어댑터를 주입한 얇은 래퍼.
// 그리드/목록·…메뉴·삭제·다운로드·업로드·이미지 뷰어는 전부 공통 컴포넌트가 담당(재사용).
import { useMemo, type MutableRefObject } from 'react';
import { FileAttachmentList, type AttachmentAdapter } from '@/components/common/file-attachments';
import { useCanWrite } from '@/lib/permissions';
import type { WorkItemResponse } from '@/types/domain';
import { useAttachments, useCreateAttachment, useDeleteAttachment } from '../hooks';

export function Attachments({ item, addRef }: {
  item: WorkItemResponse;
  addRef?: MutableRefObject<() => void>;
}) {
  const { data: attachments = [], isPending } = useAttachments(item.id);
  const create = useCreateAttachment(item.id);
  const remove = useDeleteAttachment(item.id);
  const canWrite = useCanWrite();

  const adapter: AttachmentAdapter = useMemo(() => ({
    items: attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      filePath: a.filePath,
      fileSize: a.fileSize,
      contentType: a.contentType,
      createdAt: a.createdAt,
    })),
    isLoading: isPending,
    create: (uploaded) => create.mutateAsync({
      fileName: uploaded.fileName,
      filePath: uploaded.url,
      fileSize: uploaded.fileSize,
      contentType: uploaded.contentType || null,
    }),
    remove: (id) => remove.mutateAsync(id),
    canWrite,
  }), [attachments, isPending, create, remove, canWrite]);

  return <FileAttachmentList adapter={adapter} addRef={addRef} />;
}
