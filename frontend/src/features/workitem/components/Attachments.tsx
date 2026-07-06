// 업무 첨부 섹션 (WMP-WI-012, §9.3, CR-037) — 공통 FileAttachmentList에 work_item 어댑터를 주입한 얇은 래퍼.
// 그리드/목록·…메뉴·삭제·다운로드·업로드·이미지 뷰어는 전부 공통 컴포넌트가 담당(재사용).
import { useMemo, type MutableRefObject } from 'react';
import { FileAttachmentList, type AttachmentAdapter } from '@/components/common/file-attachments';
import { useCanWrite } from '@/lib/permissions';
import type { WorkItemResponse } from '@/types/domain';
import { useAttachments, useCreateAttachment, useDeleteAttachment } from '../hooks';
import type { AttachmentKind } from '../api';

// kind: 본문 첨부 섹션=REFERENCE(참고자료), 결과 섹션=RESULT(결과물) (CR-051, BIZ-118).
// 같은 컴포넌트를 kind만 달리 재사용 — 각 섹션은 자기 성격의 파일만 조회·업로드한다.
export function Attachments({ item, addRef, kind = 'REFERENCE' }: {
  item: WorkItemResponse;
  addRef?: MutableRefObject<() => void>;
  kind?: AttachmentKind;
}) {
  const { data: attachments = [], isPending } = useAttachments(item.id, kind);
  const create = useCreateAttachment(item.id, kind);
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
