// 첨부 파일 탭 — 프로젝트 전체 업무의 첨부 집계(WMP-VIEW-007, CR-044).
// Jira "첨부 파일" 탭과 유사: 상단 필터바(파일명 검색·업로더·유형·추가일) + 썸네일 카드 그리드.
// 조회 전용 — 업로드는 업무 상세에서. 카드/썸네일 클릭=공통 FileViewer, 업무 키 클릭=상세 이동.
import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Input, Skeleton, Button, cn,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  DatePicker,
} from '@therecommerce/ds-ui';
import { Paperclip, Download } from 'lucide-react';
import { toIso, fromIso, fmtDate } from '@/lib/date';
import { ROUTES } from '@/lib/route-paths';
import { useProjectByKey } from '@/features/projects/hooks';
import { useProjectAttachments } from '@/features/view/hooks';
import type { ProjectAttachmentItem } from '@/features/view/api';
import {
  filterAttachments, uploaderOptions, attachmentKind, type AttachmentFilter, type AttachmentKind,
} from '@/features/view/attachment-filter';
import { PageShell } from '@/components/common/page-shell';
import { EmptyState } from '@/components/common/empty-state';
import { FileTypeIcon } from '@/components/common/file-attachments/FileTypeIcon';
import {
  useFileViewer, isViewable, buildFileUrl, formatFileSize, type ViewerFile,
} from '@/components/common/file-viewer';

const KIND_LABEL: Record<AttachmentKind, string> = {
  image: '이미지', pdf: 'PDF', doc: '문서', sheet: '스프레드시트', archive: '압축', other: '기타',
};
const ALL = '__all__';

export function AttachmentsView() {
  const { key = '' } = useParams();
  const { data: project } = useProjectByKey(key);
  const { data: items, isPending } = useProjectAttachments(project?.id);

  const [filter, setFilter] = useState<AttachmentFilter>({});
  const uploaders = useMemo(() => uploaderOptions(items ?? []), [items]);
  const shown = useMemo(() => filterAttachments(items ?? [], filter), [items, filter]);

  if (isPending && !items) {
    return <Skeleton className="h-[32rem] w-full rounded-lg" />;
  }

  const hasAny = (items?.length ?? 0) > 0;

  return (
    <PageShell>
      {/* 필터바 — 파일명 검색 · 업로더 · 유형 · 추가일(기간) */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          className="h-9 w-56"
          placeholder="첨부 파일 검색"
          value={filter.keyword ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
        />
        <Select
          value={filter.uploaderName ?? ALL}
          onValueChange={(v) => setFilter((f) => ({ ...f, uploaderName: v === ALL ? undefined : v }))}
        >
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="추가한 사용자" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>추가한 사용자 전체</SelectItem>
            {uploaders.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={filter.kind ?? ALL}
          onValueChange={(v) => setFilter((f) => ({ ...f, kind: v === ALL ? undefined : (v as AttachmentKind) }))}
        >
          <SelectTrigger className="h-9 w-36"><SelectValue placeholder="파일 유형" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>파일 유형 전체</SelectItem>
            {(Object.keys(KIND_LABEL) as AttachmentKind[]).map((k) => (
              <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          className="w-36"
          placeholder="시작일"
          value={fromIso(filter.from)}
          onChange={(d) => setFilter((f) => ({ ...f, from: toIso(d) || undefined }))}
        />
        <span className="text-muted-foreground">~</span>
        <DatePicker
          className="w-36"
          placeholder="종료일"
          value={fromIso(filter.to)}
          onChange={(d) => setFilter((f) => ({ ...f, to: toIso(d) || undefined }))}
        />
      </div>

      {!hasAny ? (
        <EmptyState
          icon={<Paperclip />}
          title="첨부 파일이 없습니다"
          description="이 프로젝트의 업무 항목에 추가한 모든 첨부 파일이 여기에 표시됩니다."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Paperclip />}
          title="조건에 맞는 첨부 파일이 없습니다"
          description="검색어·유형·기간 필터를 조정해 보세요."
          action={<Button variant="ghost" onClick={() => setFilter({})}>필터 초기화</Button>}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {shown.map((it) => <AttachmentCard key={it.id} item={it} />)}
        </div>
      )}
    </PageShell>
  );
}

// 썸네일 카드 — 이미지는 미리보기 썸네일, 그 외는 파일 유형 아이콘. 하단에 파일명·소속 업무·메타.
function AttachmentCard({ item }: { item: ProjectAttachmentItem }) {
  const viewer = useFileViewer();
  const viewable = isViewable(item.contentType, item.fileName || item.filePath);
  const isImage = attachmentKind(item) === 'image';

  const openViewer = () => {
    if (!viewable) return;
    const f: ViewerFile = { url: item.filePath, name: item.fileName, contentType: item.contentType };
    viewer.openOne(f);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      {/* 썸네일 영역 */}
      <button
        type="button"
        onClick={openViewer}
        disabled={!viewable}
        className={cn(
          'flex h-32 items-center justify-center bg-muted/40',
          viewable ? 'cursor-pointer hover:bg-muted/70' : 'cursor-default',
        )}
        aria-label={viewable ? `${item.fileName} 미리보기` : item.fileName}
      >
        {isImage ? (
          <img
            src={buildFileUrl(item.filePath, item.fileName)}
            alt={item.fileName}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileTypeIcon contentType={item.contentType} fileName={item.fileName} className="size-10 text-muted-foreground" />
        )}
      </button>

      {/* 메타 영역 */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium" title={item.fileName}>{item.fileName}</span>
          <a
            href={buildFileUrl(item.filePath, item.fileName, true)}
            download={item.fileName}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="다운로드"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="size-4" />
          </a>
        </div>
        {/* 소속 업무 — 키 클릭 시 상세로 이동 */}
        <Link
          to={ROUTES.workItem(item.workItemKey)}
          className="truncate text-xs text-muted-foreground hover:text-primary hover:underline"
          title={`${item.workItemKey} ${item.workItemSummary}`}
        >
          <span className="font-mono">{item.workItemKey}</span> {item.workItemSummary}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatFileSize(item.fileSize)}</span>
          <span>·</span>
          <span>{fmtDate(item.createdAt)}</span>
          {item.uploaderName && <><span>·</span><span className="truncate">{item.uploaderName}</span></>}
        </div>
      </div>
    </div>
  );
}
