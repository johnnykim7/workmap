// 공통 첨부 리스트 관리 컴포넌트(CR-037). 첨부가 필요한 모든 영역에서 어댑터만 꽂아 재사용.
// - 그리드(썸네일 카드) ⇄ 목록(행) 전환(헤더 … 메뉴)
// - 업로드(+): 파일 선택 → POST /files/upload → 어댑터.create
// - 행별: 미리보기(뷰 가능 타입) · 다운로드 · 삭제(WRITER)
// - … 메뉴: 목록/그리드 전환 · 모두 다운로드 · 모두 삭제
// - 이미지 썸네일/미리보기 클릭 → 공통 FileViewer(전역 라이트박스)
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  Button, Spinner, Skeleton, toast, cn,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@therecommerce/ds-ui';
import {
  Paperclip, Plus, MoreHorizontal, LayoutGrid, List as ListIcon,
  Download, Trash2, Eye, ChevronDown, ChevronRight, Upload,
} from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { fmtDate } from '@/lib/date';
import { useFileViewer, fileKind, isViewable, formatFileSize, buildFileUrl, type ViewerFile } from '@/components/common/file-viewer';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import type { AttachmentAdapter, AttachmentItem } from './types';
import { FileTypeIcon } from './FileTypeIcon';

const MAX_SIZE = 10 * 1024 * 1024; // BE multipart 10MB 제한과 동일.
type ViewMode = 'grid' | 'list';

export function FileAttachmentList({
  adapter,
  title = '첨부 파일',
  defaultView = 'grid',
  collapsible = false,
  addRef,
}: {
  adapter: AttachmentAdapter;
  title?: string;
  defaultView?: ViewMode;
  collapsible?: boolean;
  /** 외부(상단 +액션 메뉴 등)에서 파일 선택창을 여는 트리거. */
  addRef?: MutableRefObject<() => void>;
}) {
  const { items, isLoading, create, remove, canWrite = true } = adapter;
  const viewer = useFileViewer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 외부 트리거(예: 업무 상세 상단 "+ 첨부" 메뉴) → 파일 선택창 열기.
  useEffect(() => {
    if (addRef) addRef.current = () => fileInputRef.current?.click();
  }, [addRef]);
  const [view, setView] = useState<ViewMode>(defaultView);
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AttachmentItem | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0); // dragenter/leave가 자식 요소마다 발생 → 깊이 카운트로 안정화.

  // 뷰어로 넘길 파일 목록(전체 첨부 — 이미지 좌우 이동 시 형제 포함).
  const viewerFiles: ViewerFile[] = useMemo(
    () => items.map((a) => ({ url: a.filePath, name: a.fileName, contentType: a.contentType })),
    [items],
  );

  const openViewer = (item: AttachmentItem) => {
    const idx = items.findIndex((a) => a.id === item.id);
    viewer.open(viewerFiles, Math.max(0, idx));
  };

  // 파일 선택창·드래그&드롭 공용 업로드(멀티, 순차).
  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    const tooBig = files.find((f) => f.size > MAX_SIZE);
    if (tooBig) { toast.error(`"${tooBig.name}"이(가) 너무 큽니다(최대 10MB).`); return; }

    setUploading(true);
    try {
      // 여러 파일 순차 업로드(하나 실패해도 나머지 진행).
      for (const f of files) {
        try {
          const uploaded = await uploadFile(f);
          await create({
            url: uploaded.url,
            fileName: uploaded.fileName,
            fileSize: uploaded.fileSize,
            contentType: uploaded.contentType,
          });
        } catch (err) {
          toast.error(err instanceof Error && err.message ? err.message : `"${f.name}" 업로드 실패`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    void uploadFiles(files);
  };

  // ── 드래그 & 드롭(멀티) ──
  const onDragEnter = (e: React.DragEvent) => {
    if (!canWrite || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!canWrite || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!canWrite) return;
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) { dragDepth.current = 0; setDragOver(false); }
  };
  const onDrop = (e: React.DragEvent) => {
    if (!canWrite) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    void uploadFiles(files);
  };

  const doDelete = async (item: AttachmentItem) => {
    setBusy(true);
    try { await remove(item.id); setConfirmDelete(null); }
    finally { setBusy(false); }
  };

  const doDeleteAll = async () => {
    setBusy(true);
    try {
      for (const a of items) {
        try { await remove(a.id); } catch { /* 개별 실패는 무시하고 계속 */ }
      }
      setConfirmDeleteAll(false);
    } finally { setBusy(false); }
  };

  const downloadOne = (item: AttachmentItem) => {
    const a = document.createElement('a');
    // 서버가 원본 파일명으로 내려주도록 ?name=&download=true(서버 Content-Disposition 우선).
    a.href = buildFileUrl(item.filePath, item.fileName, true);
    a.download = item.fileName || '';
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a); a.click(); a.remove();
  };
  const downloadAll = () => items.forEach(downloadOne);

  const count = items.length;

  return (
    <section
      className={cn('relative rounded-md', dragOver && 'ring-2 ring-primary ring-offset-2')}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* 드롭 오버레이 — 드래그 중일 때만 */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-md bg-primary/10 text-sm font-medium text-primary backdrop-blur-[1px]">
          <Upload className="size-6" />
          여기에 파일을 놓으세요
        </div>
      )}
      {/* 헤더 */}
      <div className="mb-1.5 flex items-center justify-between">
        <button
          type="button"
          className={cn('flex items-center gap-1.5 text-sm font-semibold text-foreground', collapsible ? 'cursor-pointer' : 'cursor-default')}
          onClick={() => collapsible && setCollapsed((v) => !v)}
        >
          {collapsible && (collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />)}
          <Paperclip className="size-4" /> {title}
          {count > 0 && <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">{count}</span>}
        </button>

        <div className="flex items-center gap-0.5">
          {count > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0" title="더보기">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
                  {view === 'grid' ? <ListIcon className="size-4" /> : <LayoutGrid className="size-4" />}
                  {view === 'grid' ? '목록 보기로 전환' : '그리드 보기로 전환'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAll}>
                  <Download className="size-4" /> 모두 다운로드
                  <span className="ml-auto rounded bg-muted px-1.5 text-xs text-muted-foreground">{count}</span>
                </DropdownMenuItem>
                {canWrite && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteAll(true)}>
                      <Trash2 className="size-4" /> 모두 삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canWrite && (
            <>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onPick} aria-hidden />
              <Button variant="ghost" size="sm" className="size-8 p-0" disabled={uploading}
                onClick={() => fileInputRef.current?.click()} title={uploading ? '업로드 중…' : '파일 추가'}>
                {uploading ? <Spinner className="size-4" /> : <Plus className="size-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 본문 */}
      {!collapsed && (
        isLoading ? (
          <div className={view === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'space-y-1'}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className={view === 'grid' ? 'h-32 w-full rounded-md' : 'h-10 w-full'} />
            ))}
          </div>
        ) : count === 0 ? (
          <button
            type="button"
            disabled={!canWrite || uploading}
            onClick={() => canWrite && fileInputRef.current?.click()}
            className={cn(
              'flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground',
              canWrite ? 'hover:bg-muted/40' : 'cursor-default',
            )}
          >
            <Paperclip className="size-5" />
            {canWrite ? '파일을 첨부하세요' : '첨부가 없습니다.'}
          </button>
        ) : view === 'grid' ? (
          // 첨부가 많으면 이 영역만 스크롤(세부 사항·활동 영역을 밀어내지 않게).
          // 스크롤바는 감추고, 더 있으면 하단 ⌄ 화살표 칩으로 안내.
          <ScrollableArea>
            <div className="grid grid-cols-2 gap-3 py-1 sm:grid-cols-3">
              {items.map((a) => (
                <GridCard key={a.id} item={a} canWrite={canWrite}
                  onOpen={() => openViewer(a)} onDownload={() => downloadOne(a)} onDelete={() => setConfirmDelete(a)} />
              ))}
            </div>
          </ScrollableArea>
        ) : (
          <ScrollableArea stickyHeader className="rounded-md border border-border">
            {/* 헤더 행은 스크롤 중에도 상단 고정. */}
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="flex-1">이름</span>
              <span className="w-20 text-right">크기</span>
              <span className="w-40">추가된 날짜</span>
              <span className="w-20" />
            </div>
            {items.map((a) => (
              <ListRow key={a.id} item={a} canWrite={canWrite}
                onOpen={() => openViewer(a)} onDownload={() => downloadOne(a)} onDelete={() => setConfirmDelete(a)} />
            ))}
          </ScrollableArea>
        )
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="첨부 삭제"
        description={confirmDelete ? `"${confirmDelete.fileName}"을(를) 삭제할까요? 되돌릴 수 없습니다.` : ''}
        confirmLabel="삭제"
        busy={busy}
        onConfirm={() => confirmDelete && doDelete(confirmDelete)}
      />
      <ConfirmDialog
        open={confirmDeleteAll}
        onOpenChange={setConfirmDeleteAll}
        title="첨부 모두 삭제"
        description={`첨부 ${count}개를 모두 삭제할까요? 되돌릴 수 없습니다.`}
        confirmLabel="모두 삭제"
        busy={busy}
        onConfirm={doDeleteAll}
      />
    </section>
  );
}

// ── 그리드 카드 ──
function GridCard({ item, canWrite, onOpen, onDownload, onDelete }: {
  item: AttachmentItem; canWrite: boolean;
  onOpen: () => void; onDownload: () => void; onDelete: () => void;
}) {
  const kind = fileKind(item.contentType, item.fileName || item.filePath);
  const viewable = isViewable(item.contentType, item.fileName || item.filePath);

  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => (viewable ? onOpen() : onDownload())}
        className="block h-28 w-full overflow-hidden bg-muted/40"
        title={viewable ? '미리보기' : '다운로드'}
      >
        {kind === 'image' ? (
          <img src={item.filePath} alt={item.fileName} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileTypeIcon contentType={item.contentType} fileName={item.fileName} className="size-10" />
          </div>
        )}
      </button>

      {/* hover 액션 */}
      <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
        {viewable && <IconBtn title="미리보기" onClick={onOpen}><Eye className="size-3.5" /></IconBtn>}
        <IconBtn title="다운로드" onClick={onDownload}><Download className="size-3.5" /></IconBtn>
        {canWrite && <IconBtn title="삭제" danger onClick={onDelete}><Trash2 className="size-3.5" /></IconBtn>}
      </div>

      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium text-foreground" title={item.fileName}>{item.fileName}</p>
        <p className="truncate text-[11px] text-muted-foreground">{fmtDate(item.createdAt)}</p>
      </div>
    </div>
  );
}

// ── 목록 행 ──
function ListRow({ item, canWrite, onOpen, onDownload, onDelete }: {
  item: AttachmentItem; canWrite: boolean;
  onOpen: () => void; onDownload: () => void; onDelete: () => void;
}) {
  const viewable = isViewable(item.contentType, item.fileName || item.filePath);
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-muted/30">
      <FileTypeIcon contentType={item.contentType} fileName={item.fileName} className="size-5 shrink-0" />
      <button type="button" onClick={() => (viewable ? onOpen() : onDownload())}
        className="flex-1 truncate text-left font-medium hover:underline" title={item.fileName}>
        {item.fileName}
      </button>
      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</span>
      <span className="w-40 shrink-0 text-xs text-muted-foreground">{fmtDate(item.createdAt)}</span>
      <div className="flex w-20 shrink-0 justify-end gap-0.5">
        {viewable && <IconBtn title="미리보기" onClick={onOpen}><Eye className="size-4 text-muted-foreground" /></IconBtn>}
        <IconBtn title="다운로드" onClick={onDownload}><Download className="size-4 text-muted-foreground" /></IconBtn>
        {canWrite && <IconBtn title="삭제" danger onClick={onDelete}><Trash2 className="size-4" /></IconBtn>}
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, danger, children }: {
  onClick: () => void; title: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} title={title}
      className={cn(
        'flex size-7 items-center justify-center rounded hover:bg-muted',
        danger && 'text-destructive hover:bg-destructive/10',
      )}>
      {children}
    </button>
  );
}

/**
 * 자체 스크롤 영역(CR-037). 스크롤바는 감추고, 스크롤 여지가 있을 때만 하단에 ⌄ 화살표 칩을 띄운다.
 * - 맨 아래에 닿으면 화살표가 사라진다(동적). 화살표 클릭 시 한 화면 아래로 스크롤.
 * - 상·하단 페이드(mask)로 잘림을 부드럽게. children은 스크롤 콘텐츠.
 * - stickyHeader=true면(목록 뷰) mask 페이드를 끈다(헤더가 흐려지지 않게).
 */
function ScrollableArea({ children, className, stickyHeader }: {
  children: ReactNode; className?: string; stickyHeader?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const recompute = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 스크롤 가능 + 아직 맨 아래가 아니면 화살표 표시(1px 여유).
    setCanScrollDown(el.scrollHeight - el.clientHeight - el.scrollTop > 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    recompute();
    el.addEventListener('scroll', recompute, { passive: true });
    // 컨테이너 크기 변동 감지(창 리사이즈 등). 콘텐츠 개수 변동은 아래 deps(children)로 재계산.
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', recompute); ro.disconnect(); };
  }, [recompute, children]);

  const scrollDown = () => {
    const el = ref.current;
    if (el) el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className={cn('scrollbar-hide max-h-96 overflow-y-auto', !stickyHeader && canScrollDown && 'fade-scroll-y', className)}
      >
        {children}
      </div>
      {/* 더 스크롤할 게 있을 때만 하단 화살표 칩 */}
      {canScrollDown && (
        <button
          type="button"
          onClick={scrollDown}
          title="아래로 스크롤"
          className="absolute bottom-2 left-1/2 z-20 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="size-4 animate-bounce" />
        </button>
      )}
    </div>
  );
}
