// 패널 사이 가로 리사이즈 핸들 (axopm CommPage ResizeDivider 포팅).
// 드래그 중 전역 오버레이로 Tiptap 등 콘텐츠의 마우스 이벤트를 차단한다.
import { useEffect, useRef, useState } from 'react';
import { cn } from '@therecommerce/ds-ui';

interface Props {
  /** 마우스 이동 delta(px, 우측 양수). 호출자가 좌/우 패널 방향에 맞게 부호를 해석한다. */
  onDrag: (delta: number) => void;
  'aria-label'?: string;
}

export function ResizeDivider({ onDrag, 'aria-label': ariaLabel }: Props) {
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const onDragRef = useRef(onDrag);
  onDragRef.current = onDrag;

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    lastX.current = e.clientX;
  };

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onDragRef.current(delta);
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  return (
    <>
      {/* 드래그 중 전체 화면 오버레이 — 콘텐츠 마우스 이벤트/텍스트 선택 차단 */}
      {dragging && <div className="fixed inset-0 z-[9999] cursor-col-resize select-none" />}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={ariaLabel ?? '패널 크기 조절'}
        onMouseDown={onMouseDown}
        className={cn(
          'relative w-1 shrink-0 cursor-col-resize transition-colors',
          dragging ? 'bg-primary/60' : 'bg-border hover:bg-primary/40',
        )}
      >
        {/* 시각은 1px이지만 클릭 hitbox는 좌우 6px씩 확장 */}
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>
    </>
  );
}
