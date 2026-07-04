// 공통 파일 뷰어 라이트박스(CR-037). 전역 1개 — 첨부 리스트·에디터 인라인 이미지가 공유.
// - 이미지: wheel 줌 + 버튼 줌 + 마우스 드래그 팬 + 맞춤/실제크기 + 좌우 이동(여러 이미지) + 다운로드
// - PDF: 브라우저 내장 <iframe> + 다운로드
// - 기타: 미리보기 불가 안내 + 다운로드
// 의존성 0(줌·팬 자체 구현) — Tailwind v4 유틸 정렬 흔들림 방지([[workmap-tailwind-lnb-trap]]).
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent,
} from 'react';
import { Button, cn } from '@therecommerce/ds-ui';
import {
  X, Download, ZoomIn, ZoomOut, Maximize2, RotateCcw, ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import { fileKind, buildFileUrl } from './file-kind';
import type { FileViewerContextValue, ViewerFile } from './types';

const FileViewerContext = createContext<FileViewerContextValue | null>(null);

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;

interface ViewerState {
  files: ViewerFile[];
  index: number;
}

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ViewerState | null>(null);

  const open = useCallback((files: ViewerFile[], startIndex = 0) => {
    if (!files.length) return;
    const clamped = Math.max(0, Math.min(startIndex, files.length - 1));
    setState({ files, index: clamped });
  }, []);
  const openOne = useCallback((file: ViewerFile) => open([file], 0), [open]);
  const close = useCallback(() => setState(null), []);

  const ctx = useMemo<FileViewerContextValue>(() => ({ open, openOne, close }), [open, openOne, close]);

  return (
    <FileViewerContext.Provider value={ctx}>
      {children}
      {state && (
        <Lightbox
          files={state.files}
          index={state.index}
          onIndex={(i) => setState((s) => (s ? { ...s, index: i } : s))}
          onClose={close}
        />
      )}
    </FileViewerContext.Provider>
  );
}

export function useFileViewer(): FileViewerContextValue {
  const ctx = useContext(FileViewerContext);
  if (!ctx) throw new Error('useFileViewer must be used within FileViewerProvider');
  return ctx;
}

function downloadFile(file: ViewerFile) {
  const a = document.createElement('a');
  // 서버 Content-Disposition이 download 파일명을 결정하도록 ?name=&download=true를 붙인다
  // (a.download은 cross-origin/서버 헤더에 밀려 무시될 수 있어 서버가 원본명을 내려주게 함).
  a.href = buildFileUrl(file.url, file.name, true);
  a.download = file.name || '';
  a.target = '_blank';
  a.rel = 'noreferrer noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function Lightbox({
  files, index, onIndex, onClose,
}: {
  files: ViewerFile[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const file = files[index];
  const kind = fileKind(file.contentType, file.name || file.url);

  // 같은 목록 내 이동 가능한 형제(이미지·PDF 등 뷰 가능한 것만 순회 대상 — 그냥 전체 순회).
  const canPrev = index > 0;
  const canNext = index < files.length - 1;

  // ESC 닫기 · 좌우 이동.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && canPrev) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && canNext) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    // 라이트박스 열려있는 동안 배경 스크롤 잠금.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, canPrev, canNext, onClose, onIndex]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 상단 바: 파일명 + 액션 */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="flex-1 truncate text-sm font-medium" title={file.name}>{file.name}</span>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/15" onClick={() => downloadFile(file)}>
          <Download className="size-4" /> 다운로드
        </Button>
        <Button variant="ghost" size="sm" className="size-8 p-0 text-white hover:bg-white/15" onClick={onClose} title="닫기(ESC)">
          <X className="size-5" />
        </Button>
      </div>

      {/* 본문 */}
      <div className="relative flex-1 overflow-hidden" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {kind === 'image' ? (
          <ImagePane key={file.url} file={file} />
        ) : kind === 'pdf' ? (
          <iframe title={file.name} src={buildFileUrl(file.url, file.name)} className="h-full w-full bg-white" onClick={(e) => e.stopPropagation()} />
        ) : (
          <UnsupportedPane file={file} onDownload={() => downloadFile(file)} />
        )}

        {/* 좌우 이동(여러 파일) */}
        {canPrev && (
          <NavButton side="left" onClick={() => onIndex(index - 1)} />
        )}
        {canNext && (
          <NavButton side="right" onClick={() => onIndex(index + 1)} />
        )}
      </div>

      {files.length > 1 && (
        <div className="py-2 text-center text-xs text-white/70" onClick={(e) => e.stopPropagation()}>
          {index + 1} / {files.length}
        </div>
      )}
    </div>
  );
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25',
        side === 'left' ? 'left-3' : 'right-3',
      )}
      title={side === 'left' ? '이전(←)' : '다음(→)'}
    >
      {side === 'left' ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
    </button>
  );
}

function UnsupportedPane({ file, onDownload }: { file: ViewerFile; onDownload: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-white" onClick={(e) => e.stopPropagation()}>
      <FileText className="size-14 text-white/60" />
      <p className="text-sm text-white/80">미리보기를 지원하지 않는 파일입니다.</p>
      <Button variant="secondary" onClick={onDownload}>
        <Download className="size-4" /> 다운로드
      </Button>
    </div>
  );
}

/** 이미지 줌/팬 뷰어(자체 구현). wheel 줌 + 드래그 팬 + 버튼. */
function ImagePane({ file }: { file: ViewerFile }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor)));
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx((v) => v + dx);
    setTy((v) => v + dy);
  }, []);
  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const zoomed = scale !== 1 || tx !== 0 || ty !== 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <div
        className={cn('flex h-full w-full items-center justify-center overflow-hidden', zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in')}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={() => (zoomed ? reset() : zoomBy(1.8))}
      >
        <img
          src={file.url}
          alt={file.name}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transition: dragging.current ? 'none' : 'transform 80ms' }}
        />
      </div>

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-white">
        <ZoomCtl title="축소" onClick={() => zoomBy(1 / 1.25)}><ZoomOut className="size-4" /></ZoomCtl>
        <span className="min-w-12 text-center text-xs tabular-nums">{Math.round(scale * 100)}%</span>
        <ZoomCtl title="확대" onClick={() => zoomBy(1.25)}><ZoomIn className="size-4" /></ZoomCtl>
        <div className="mx-1 h-4 w-px bg-white/25" />
        <ZoomCtl title="실제 크기(1:1)" onClick={() => { setScale(1); setTx(0); setTy(0); }}><Maximize2 className="size-4" /></ZoomCtl>
        <ZoomCtl title="초기화" onClick={reset}><RotateCcw className="size-4" /></ZoomCtl>
      </div>
    </div>
  );
}

function ZoomCtl({ onClick, title, children }: { onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex size-7 items-center justify-center rounded-full hover:bg-white/20">
      {children}
    </button>
  );
}
