// 간트 오늘선 + 스프린트 밴드 오버레이(CR-035) — SVAR highlightTime 기반.
// SVAR가 각 시간축 날짜에 대해 highlightTime(date, unit)을 호출하고, 반환 CSS 클래스를 그 셀에 부여한다.
// 좌표 계산 없이(SVAR 내부 스케일에 위임) 오늘/스프린트 기간 셀을 강조 → 자체 오버레이 레이어 불필요.
// 순수함수 — 단위테스트 대상.
import type { Sprint } from '@/types/domain';

/** 스프린트 밴드(기간 있는 스프린트만). start/end는 epoch ms(로컬 자정). */
export interface SprintBand {
  id: number;
  name: string;
  start: number;
  end: number;
}

const DAY = 86_400_000;

/** yyyy-MM-dd → 로컬 자정 epoch ms. 잘못된 값/빈 값은 null. */
function localMidnight(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Sprint[] → 기간 있는 밴드 목록. startDate·endDate 둘 다 있어야 밴드로 취급. */
export function toSprintBands(sprints: Sprint[]): SprintBand[] {
  const bands: SprintBand[] = [];
  for (const s of sprints) {
    const start = localMidnight(s.startDate);
    const end = localMidnight(s.endDate);
    if (start == null || end == null) continue;
    bands.push({ id: s.id, name: s.name, start: Math.min(start, end), end: Math.max(start, end) });
  }
  return bands;
}

/** date가 어느 밴드 기간에 드는지(포함: [start, end+1일) — 종료일 당일까지). */
export function dateInBand(dateMs: number, bands: SprintBand[]): boolean {
  for (const b of bands) {
    if (dateMs >= b.start && dateMs < b.end + DAY) return true;
  }
  return false;
}

/** 두 Date가 같은 날(로컬)인지. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * highlightTime은 각 눈금 셀의 시작 날짜로 호출된다(월 스케일=매월 1일, 주=주 시작 등).
 * 따라서 "오늘"을 정확히 맞추려면 unit별로 셀 범위에 today가 드는지로 판정한다.
 */
function cellContainsToday(cellStart: Date, unit: string, today: Date): boolean {
  switch (unit) {
    case 'day':
      return isSameLocalDay(cellStart, today);
    case 'week': {
      const s = cellStart.getTime();
      return today.getTime() >= s && today.getTime() < s + 7 * DAY;
    }
    case 'month':
      return cellStart.getFullYear() === today.getFullYear()
        && cellStart.getMonth() === today.getMonth();
    case 'quarter':
      return cellStart.getFullYear() === today.getFullYear()
        && Math.floor(cellStart.getMonth() / 3) === Math.floor(today.getMonth() / 3);
    case 'year':
      return cellStart.getFullYear() === today.getFullYear();
    default:
      return isSameLocalDay(cellStart, today);
  }
}

/**
 * SVAR highlightTime 콜백 본체(CR-035). 오늘 셀 → 'wmp-today', 스프린트 기간 셀 → 'wmp-sprint'.
 * today를 인자로 받아 순수 유지(컴포넌트에서 new Date() 주입).
 * - 오늘: 모든 unit에서 "오늘이 속한 셀"을 강조(월 스케일이면 이번 달 셀).
 * - 스프린트 밴드: day/week 단위 셀에만(상위 월/년 눈금엔 배경 안 줌 — 색 절제).
 */
export function highlightForDate(
  date: Date,
  unit: string,
  bands: SprintBand[],
  today: Date,
): string {
  const classes: string[] = [];
  if (cellContainsToday(date, unit, today)) classes.push('wmp-today');
  if (unit === 'day' || unit === 'week') {
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (dateInBand(midnight, bands)) classes.push('wmp-sprint');
  }
  return classes.join(' ');
}
