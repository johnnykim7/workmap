// 타임라인 막대 배치 계산 — 순수 함수(단위테스트 대상).
// 표시 구간(전체 항목의 min(start)~max(due)) 대비 각 항목의 막대 좌/우 비율(0~1)을 산출.
import type { TimelineItem } from './api';

const DAY = 86_400_000;

/** yyyy-MM-dd → epoch ms(UTC 자정). 잘못된 값은 null. */
export function parseDay(s: string | null): number | null {
  if (!s) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** 항목의 유효 시작/종료(한쪽만 있으면 같은 날로 보정). 둘 다 없으면 null. */
export function itemRange(it: TimelineItem): { start: number; end: number } | null {
  const s = parseDay(it.startDate);
  const e = parseDay(it.dueDate);
  if (s == null && e == null) return null;
  const start = s ?? e!;
  const end = e ?? s!;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

export interface TimelineSpan {
  min: number; // 표시 구간 시작(ms)
  max: number; // 표시 구간 끝(ms)
  totalDays: number;
}

/** 일정 있는 항목들로 전체 표시 구간 산출. 항목이 없으면 null. */
export function computeSpan(items: TimelineItem[]): TimelineSpan | null {
  let min = Infinity;
  let max = -Infinity;
  for (const it of items) {
    const r = itemRange(it);
    if (!r) continue;
    if (r.start < min) min = r.start;
    if (r.end > max) max = r.end;
  }
  if (min === Infinity) return null;
  // 끝 막대가 0폭이 되지 않도록 최소 1일 보장.
  if (max <= min) max = min + DAY;
  return { min, max, totalDays: Math.round((max - min) / DAY) + 1 };
}

/** 항목 막대의 left/width 백분율(0~100). 구간 밖이면 클램프. 일정 없으면 null. */
export function barMetrics(it: TimelineItem, span: TimelineSpan): { left: number; width: number } | null {
  const r = itemRange(it);
  if (!r) return null;
  const total = span.max - span.min;
  const left = ((Math.max(r.start, span.min) - span.min) / total) * 100;
  const right = ((Math.min(r.end, span.max) - span.min) / total) * 100;
  const width = Math.max(right - left, 1.5); // 한 점짜리도 보이게 최소폭
  return { left, width: Math.min(width, 100 - left) };
}

/** 표시 구간을 월 1일 단위 눈금으로(헤더용). 각 눈금의 left%와 라벨("M월"). */
export function monthTicks(span: TimelineSpan): { left: number; label: string }[] {
  const ticks: { left: number; label: string }[] = [];
  const total = span.max - span.min;
  const d = new Date(span.min);
  // 시작 월의 다음 1일부터 순회.
  let cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  if (cur < span.min) cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  while (cur <= span.max) {
    const cd = new Date(cur);
    ticks.push({ left: ((cur - span.min) / total) * 100, label: `${cd.getUTCMonth() + 1}월` });
    cur = Date.UTC(cd.getUTCFullYear(), cd.getUTCMonth() + 1, 1);
  }
  return ticks;
}

/** start_date 오름차순 정렬(일정 없는 항목은 뒤로). */
export function sortByStart(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => {
    const ra = itemRange(a);
    const rb = itemRange(b);
    if (!ra && !rb) return 0;
    if (!ra) return 1;
    if (!rb) return -1;
    return ra.start - rb.start;
  });
}
