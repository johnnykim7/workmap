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

/**
 * 표시 구간을 주 단위 눈금으로(헤더용, CR-021). 각 주의 시작(일요일) 기준 left%와 라벨("M/d").
 * 첫 눈금은 구간 시작 이후 첫 일요일(구간 시작이 일요일이면 그날 포함).
 */
export function weekTicks(span: TimelineSpan): { left: number; label: string }[] {
  const ticks: { left: number; label: string }[] = [];
  const total = span.max - span.min;
  const d = new Date(span.min);
  // 구간 시작이 속한 주의 일요일.
  const sundayOfStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay());
  let cur = sundayOfStart < span.min ? sundayOfStart + 7 * DAY : sundayOfStart;
  while (cur <= span.max) {
    const cd = new Date(cur);
    ticks.push({ left: ((cur - span.min) / total) * 100, label: `${cd.getUTCMonth() + 1}/${cd.getUTCDate()}` });
    cur += 7 * DAY;
  }
  return ticks;
}

/**
 * 표시 구간을 일 단위 눈금으로(헤더용, CR-023 "오늘" 줌). 각 날 0시 기준 left%와 라벨("M/d").
 * 폭이 매우 좁은 "오늘" 창에서만 쓰이므로 모든 날에 눈금을 찍는다.
 */
export function dayTicks(span: TimelineSpan): { left: number; label: string }[] {
  const ticks: { left: number; label: string }[] = [];
  const total = span.max - span.min;
  const d = new Date(span.min);
  let cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (cur < span.min) cur += DAY;
  while (cur <= span.max) {
    const cd = new Date(cur);
    ticks.push({ left: ((cur - span.min) / total) * 100, label: `${cd.getUTCMonth() + 1}/${cd.getUTCDate()}` });
    cur += DAY;
  }
  return ticks;
}

/**
 * 표시 구간을 분기(1·4·7·10월 1일) 눈금으로(헤더용, CR-023). left%와 라벨("YYYY Qn").
 */
export function quarterTicks(span: TimelineSpan): { left: number; label: string }[] {
  const ticks: { left: number; label: string }[] = [];
  const total = span.max - span.min;
  const d = new Date(span.min);
  // 구간 시작이 속한 분기의 시작 월(0,3,6,9).
  let y = d.getUTCFullYear();
  let qStartMonth = Math.floor(d.getUTCMonth() / 3) * 3;
  let cur = Date.UTC(y, qStartMonth, 1);
  if (cur < span.min) {
    qStartMonth += 3;
    if (qStartMonth > 9) { qStartMonth = 0; y += 1; }
    cur = Date.UTC(y, qStartMonth, 1);
  }
  while (cur <= span.max) {
    const cd = new Date(cur);
    const q = Math.floor(cd.getUTCMonth() / 3) + 1;
    ticks.push({ left: ((cur - span.min) / total) * 100, label: `${cd.getUTCFullYear()} Q${q}` });
    cur = Date.UTC(cd.getUTCFullYear(), cd.getUTCMonth() + 3, 1);
  }
  return ticks;
}

// 타임라인 시간 단위(CR-023) — 줌(눈금 밀도) + 구간 한정. 'today'=일별, 'week'=주별, 'month'=월별, 'quarter'=분기별.
export type TimeScale = 'today' | 'week' | 'month' | 'quarter';

/** 단위에 따른 눈금 생성기 선택. */
export function ticksFor(scale: TimeScale, span: TimelineSpan): { left: number; label: string }[] {
  switch (scale) {
    case 'today': return dayTicks(span);
    case 'week': return weekTicks(span);
    case 'quarter': return quarterTicks(span);
    case 'month':
    default: return monthTicks(span);
  }
}

// 단위별 "오늘 기준 창"의 좌/우 반경(일수). 구간 한정(CR-023).
const WINDOW_DAYS: Record<TimeScale, { before: number; after: number }> = {
  today: { before: 3, after: 7 },        // ±수일
  week: { before: 7, after: 21 },        // 이번 주 중심 ±주
  month: { before: 30, after: 60 },      // ±개월
  quarter: { before: 90, after: 180 },   // ±분기
};

/**
 * 단위에 맞춘 표시 구간(CR-023 "구간 한정 + 줌").
 * 데이터 전체가 아니라 오늘(today, epoch ms) 기준 창으로 제한한다. 막대는 창 밖이면 barMetrics가 클램프.
 * today를 인자로 받아 순수 함수 유지(차트에서 new Date()로 주입).
 */
export function spanFor(scale: TimeScale, today: number): TimelineSpan {
  const d = new Date(today);
  const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const w = WINDOW_DAYS[scale];
  const min = base - w.before * DAY;
  const max = base + w.after * DAY;
  return { min, max, totalDays: Math.round((max - min) / DAY) + 1 };
}

/** 표시 구간 안에서 오늘 세로선의 left%(0~100). 창 밖이면 null. */
export function todayMarker(span: TimelineSpan, today: number): number | null {
  if (today < span.min || today > span.max) return null;
  return ((today - span.min) / (span.max - span.min)) * 100;
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

// ───────────────────────── 에픽 그룹핑(WBS, CR-023) ─────────────────────────

const NO_EPIC = -1; // "에픽 없음" 그룹 키.

export interface EpicGroup {
  epicId: number;        // 실제 epicId, 또는 NO_EPIC(-1)
  name: string;          // 에픽 title, 또는 "(에픽 없음)"
  isNoEpic: boolean;
  children: TimelineItem[];
  rollup: { start: number; end: number } | null; // 자식들의 min(start)~max(due), 모두 일정 없으면 null
}

/**
 * 항목을 에픽 단위로 묶어 WBS 그룹 배열로 반환(CR-023).
 * - epicNames: epicId → title 맵(EPIC work_item 조회 결과).
 * - 그룹 정렬: 에픽 롤업 start 오름차순(일정 없는 에픽은 뒤), "(에픽 없음)"은 항상 맨 끝.
 * - 그룹 내 자식: sortByStart.
 * 에픽 자신(issueType=EPIC)은 행으로 그리지 않으므로 자식에서 제외.
 */
export function groupByEpic(items: TimelineItem[], epicNames: Map<number, string>): EpicGroup[] {
  const buckets = new Map<number, TimelineItem[]>();
  for (const it of items) {
    if (it.issueType === 'EPIC') continue; // 에픽 자체는 그룹 헤더로만 등장
    const key = it.epicId ?? NO_EPIC;
    const arr = buckets.get(key) ?? [];
    arr.push(it);
    buckets.set(key, arr);
  }
  const groups: EpicGroup[] = [];
  for (const [key, children] of buckets) {
    const isNoEpic = key === NO_EPIC;
    let start = Infinity;
    let end = -Infinity;
    for (const c of children) {
      const r = itemRange(c);
      if (!r) continue;
      if (r.start < start) start = r.start;
      if (r.end > end) end = r.end;
    }
    const rollup = start === Infinity ? null : { start, end };
    groups.push({
      epicId: key,
      name: isNoEpic ? '(에픽 없음)' : (epicNames.get(key) ?? `에픽 #${key}`),
      isNoEpic,
      children: sortByStart(children),
      rollup,
    });
  }
  // 정렬: (에픽 없음) 맨 끝 → 롤업 start 오름차순(없으면 뒤).
  groups.sort((a, b) => {
    if (a.isNoEpic !== b.isNoEpic) return a.isNoEpic ? 1 : -1;
    if (!a.rollup && !b.rollup) return 0;
    if (!a.rollup) return 1;
    if (!b.rollup) return -1;
    return a.rollup.start - b.rollup.start;
  });
  return groups;
}

/** 롤업 구간의 막대 left/width 백분율(에픽 행용). barMetrics와 동일 규칙. */
export function rollupMetrics(rollup: { start: number; end: number }, span: TimelineSpan): { left: number; width: number } {
  const total = span.max - span.min;
  const left = ((Math.max(rollup.start, span.min) - span.min) / total) * 100;
  const right = ((Math.min(rollup.end, span.max) - span.min) / total) * 100;
  const width = Math.max(right - left, 1.5);
  return { left, width: Math.min(width, 100 - left) };
}
