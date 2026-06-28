// 캘린더 그리드 계산 — 순수 함수(단위테스트 대상).
// 월(year, month)을 일요일 시작 주 단위 6×7(또는 가변) 그리드로 펼치고,
// BE의 days(due_date별 묶음)를 날짜 칸에 매핑한다.
import type { CalendarDay, CalendarResponse, TimelineItem } from './api';

export interface CalendarCell {
  date: string; // yyyy-MM-dd
  day: number; // 1~31
  inMonth: boolean; // 해당 월 소속 여부(앞뒤 보충 칸은 false)
  items: TimelineItem[];
}

function ymd(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * year/month(1~12)의 달력 셀 배열. 첫 주는 직전 달, 마지막 주는 다음 달로 채워 7의 배수 길이.
 * days: BE CalendarResponse.days(date→items). 날짜 키로 items를 매핑.
 */
export function buildCalendarCells(year: number, month: number, days: CalendarDay[]): CalendarCell[] {
  const itemsByDate = new Map<string, TimelineItem[]>();
  for (const d of days) itemsByDate.set(d.date, d.items);

  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay(); // 0=일
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: CalendarCell[] = [];

  // 앞 보충(직전 달 말일들)
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = prevDays - i;
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    const date = ymd(py, pm, d);
    cells.push({ date, day: d, inMonth: false, items: itemsByDate.get(date) ?? [] });
  }
  // 당월
  for (let d = 1; d <= daysInMonth; d++) {
    const date = ymd(year, month, d);
    cells.push({ date, day: d, inMonth: true, items: itemsByDate.get(date) ?? [] });
  }
  // 뒤 보충(7의 배수까지)
  let nd = 1;
  while (cells.length % 7 !== 0) {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    const date = ymd(ny, nm, nd);
    cells.push({ date, day: nd, inMonth: false, items: itemsByDate.get(date) ?? [] });
    nd++;
  }
  return cells;
}

/** 이전/다음 달 계산(연도 넘김 처리). */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 캘린더 칩 드래그 낙관적 갱신(CR-021) — itemId 항목을 toDate 칸으로 옮긴 새 응답을 반환(불변).
 * 원래 날짜에서 제거 + 대상 날짜에 추가(dueDate도 갱신). 같은 날짜면 원본 그대로.
 * 대상 날짜 묶음이 없으면 새로 만들고, 비게 된 날짜 묶음은 정리한다.
 */
export function moveCalendarItem(resp: CalendarResponse, itemId: number, toDate: string): CalendarResponse {
  let moved: TimelineItem | undefined;
  // 1) 모든 날짜에서 해당 항목 제거하며 꺼냄
  const stripped = resp.days
    .map((d) => {
      const keep: TimelineItem[] = [];
      for (const it of d.items) {
        if (it.id === itemId) moved = it;
        else keep.push(it);
      }
      return { date: d.date, items: keep };
    })
    .filter((d) => d.items.length > 0);

  if (!moved) return resp; // 못 찾으면 무변경
  const movedItem: TimelineItem = { ...moved, dueDate: toDate };

  // 2) 대상 날짜 묶음에 추가(없으면 신설)
  const idx = stripped.findIndex((d) => d.date === toDate);
  let days: CalendarDay[];
  if (idx >= 0) {
    days = stripped.map((d, i) => (i === idx ? { date: d.date, items: [...d.items, movedItem] } : d));
  } else {
    days = [...stripped, { date: toDate, items: [movedItem] }];
  }
  // 날짜 오름차순 유지(BE 정렬과 동일)
  days.sort((a, b) => a.date.localeCompare(b.date));
  return { ...resp, days };
}
