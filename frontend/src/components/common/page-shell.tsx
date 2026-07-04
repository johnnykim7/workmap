// 공통 화면 골격 — "헤더는 고정, 데이터 영역만 스크롤"을 전 화면 통일(사용자 요구, Jira식).
// 상위(AppShell p-5 → ProjectLayout)가 넘겨준 높이를 받아 세로 flex로 쪼갠다:
//   - header 슬롯 = shrink-0 (제목·검색·필터바 등 — 항상 고정)
//   - children   = flex-1 min-h-0 overflow-y-auto (표·리스트·차트 — 이 영역만 스크롤)
// 높이 계약이 위에서 끊기면(부모가 h-full을 안 주면) flex-1이 0이 되어 스크롤이 안 생기니,
// 부모 체인(admin-shell-content → p-5(h-full) → ProjectLayout(h-full) → View)이 이어져야 한다.
import type { ReactNode } from 'react';

interface Props {
  /** 고정될 상단 영역(제목/검색/필터/토글 등). 없으면 전체가 스크롤 본문이 된다. */
  header?: ReactNode;
  /** 스크롤되는 데이터 영역. */
  children: ReactNode;
  /** 본문 스크롤 컨테이너에 추가 클래스(예: 자체 overflow를 가진 칸반은 overflow 해제). */
  bodyClassName?: string;
  /** true면 본문 자체 overflow를 끄고(자식이 스스로 스크롤 관리) 높이만 채운다 — 칸반/타임라인용. */
  bodyOwnsScroll?: boolean;
}

export function PageShell({ header, children, bodyClassName = '', bodyOwnsScroll = false }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {header != null && <div className="shrink-0">{header}</div>}
      <div
        className={`min-h-0 flex-1 ${bodyOwnsScroll ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'} ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
