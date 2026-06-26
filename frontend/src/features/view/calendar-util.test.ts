// 캘린더 그리드 유틸 단위 테스트 — 셀 생성/월 이동 매핑(WMP-VIEW-003).
import { describe, expect, it } from 'vitest';
import { buildCalendarCells, shiftMonth } from './calendar-util';
import type { CalendarDay, TimelineItem } from './api';

function tItem(id: number): TimelineItem {
  return {
    id, key: `WMP-${id}`, title: `t${id}`, issueType: 'TASK', commonStatus: 'TODO',
    priority: 'MEDIUM', assigneeId: null, epicId: null,
    startDate: null, dueDate: null, progress: 0,
  };
}

describe('buildCalendarCells', () => {
  it('셀수_7의배수', () => {
    const cells = buildCalendarCells(2026, 6, []);
    expect(cells.length % 7).toBe(0);
  });

  it('당월_1일부터_말일까지_inMonth', () => {
    // 2026-06: 30일
    const cells = buildCalendarCells(2026, 6, []);
    const inMonth = cells.filter((c) => c.inMonth);
    expect(inMonth.length).toBe(30);
    expect(inMonth[0].day).toBe(1);
    expect(inMonth[29].day).toBe(30);
  });

  it('첫칸은_일요일정렬_앞보충은inMonth_false', () => {
    // 2026-06-01은 월요일 → 앞에 일요일(5/31) 1칸 보충
    const cells = buildCalendarCells(2026, 6, []);
    expect(cells[0].inMonth).toBe(false);
    expect(cells[1].inMonth).toBe(true);
    expect(cells[1].day).toBe(1);
  });

  it('days매핑_해당날짜칸에items', () => {
    const days: CalendarDay[] = [{ date: '2026-06-15', items: [tItem(1), tItem(2)] }];
    const cells = buildCalendarCells(2026, 6, days);
    const c15 = cells.find((c) => c.date === '2026-06-15')!;
    expect(c15.items.map((i) => i.id)).toEqual([1, 2]);
    // 매핑 안 된 날은 빈 배열
    expect(cells.find((c) => c.date === '2026-06-16')!.items).toEqual([]);
  });
});

describe('shiftMonth', () => {
  it('다음달', () => {
    expect(shiftMonth(2026, 6, 1)).toEqual({ year: 2026, month: 7 });
  });
  it('12월에서_다음달_연도넘김', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
  it('1월에서_이전달_연도역행', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
  it('여러달이동', () => {
    expect(shiftMonth(2026, 6, -8)).toEqual({ year: 2025, month: 10 });
  });
});
