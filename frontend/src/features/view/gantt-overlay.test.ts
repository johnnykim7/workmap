// gantt-overlay 단위테스트 (CR-035) — 스프린트 밴드 + 오늘선 highlightTime.
import { describe, expect, it } from 'vitest';
import { toSprintBands, dateInBand, isSameLocalDay, highlightForDate } from './gantt-overlay';
import type { Sprint } from '@/types/domain';

function sprint(over: Partial<Sprint> = {}): Sprint {
  return {
    id: 1, projectId: 1, name: 'S1', status: 'FUTURE',
    startDate: '2026-07-06', endDate: '2026-07-17', ...over,
  };
}

describe('toSprintBands', () => {
  it('기간있는스프린트만_밴드', () => {
    const bands = toSprintBands([
      sprint({ id: 1 }),
      sprint({ id: 2, startDate: null, endDate: null }), // 기간 없음 → 제외
    ]);
    expect(bands).toHaveLength(1);
    expect(bands[0].id).toBe(1);
  });

  it('역순날짜_정렬보정', () => {
    const [b] = toSprintBands([sprint({ startDate: '2026-07-17', endDate: '2026-07-06' })]);
    expect(b.start).toBeLessThan(b.end);
  });
});

describe('dateInBand', () => {
  const bands = toSprintBands([sprint({ startDate: '2026-07-06', endDate: '2026-07-10' })]);
  const day = (s: string) => new Date(s + 'T00:00:00').getTime();

  it('기간내_true', () => {
    expect(dateInBand(day('2026-07-08'), bands)).toBe(true);
  });
  it('종료일당일_포함', () => {
    expect(dateInBand(day('2026-07-10'), bands)).toBe(true);
  });
  it('기간밖_false', () => {
    expect(dateInBand(day('2026-07-11'), bands)).toBe(false);
    expect(dateInBand(day('2026-07-05'), bands)).toBe(false);
  });
});

describe('isSameLocalDay', () => {
  it('같은날_true', () => {
    expect(isSameLocalDay(new Date(2026, 6, 4, 9), new Date(2026, 6, 4, 23))).toBe(true);
  });
  it('다른날_false', () => {
    expect(isSameLocalDay(new Date(2026, 6, 4), new Date(2026, 6, 5))).toBe(false);
  });
});

describe('highlightForDate', () => {
  const today = new Date(2026, 6, 15); // 2026-07-15
  const bands = toSprintBands([sprint({ startDate: '2026-07-06', endDate: '2026-07-20' })]);

  it('day단위_오늘셀_wmp-today', () => {
    expect(highlightForDate(new Date(2026, 6, 15), 'day', [], today)).toContain('wmp-today');
    expect(highlightForDate(new Date(2026, 6, 14), 'day', [], today)).not.toContain('wmp-today');
  });

  it('month단위_이번달셀_wmp-today', () => {
    // 월 스케일은 매월 1일로 호출됨 — 7월 1일 셀이 오늘(7/15) 포함 달.
    expect(highlightForDate(new Date(2026, 6, 1), 'month', [], today)).toContain('wmp-today');
    expect(highlightForDate(new Date(2026, 5, 1), 'month', [], today)).not.toContain('wmp-today');
  });

  it('day단위_스프린트기간셀_wmp-sprint', () => {
    expect(highlightForDate(new Date(2026, 6, 10), 'day', bands, today)).toContain('wmp-sprint');
    expect(highlightForDate(new Date(2026, 6, 25), 'day', bands, today)).not.toContain('wmp-sprint');
  });

  it('month단위_스프린트밴드_배경안줌', () => {
    // 월 단위 셀엔 밴드 배경 안 붙임(색 절제).
    expect(highlightForDate(new Date(2026, 6, 1), 'month', bands, today)).not.toContain('wmp-sprint');
  });

  it('오늘+스프린트_둘다', () => {
    const r = highlightForDate(new Date(2026, 6, 15), 'day', bands, today);
    expect(r).toContain('wmp-today');
    expect(r).toContain('wmp-sprint');
  });
});
