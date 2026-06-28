// 캘린더 그리드 유틸 단위 테스트 — 셀 생성/월 이동 매핑/칩 이동(WMP-VIEW-003, CR-021).
import { describe, expect, it } from 'vitest';
import { buildCalendarCells, shiftMonth, moveCalendarItem } from './calendar-util';
import type { CalendarDay, CalendarResponse, TimelineItem } from './api';

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

describe('moveCalendarItem (CR-021 칩 드래그 낙관적 갱신)', () => {
  function resp(days: CalendarDay[]): CalendarResponse {
    return { projectId: 1, year: 2026, month: 6, days };
  }
  function dItem(id: number, due: string): TimelineItem {
    return { ...tItem(id), dueDate: due };
  }

  it('다른날로_이동하면_원래날짜에서_제거되고_대상날짜에_추가', () => {
    const r = resp([
      { date: '2026-06-10', items: [dItem(1, '2026-06-10'), dItem(2, '2026-06-10')] },
      { date: '2026-06-15', items: [dItem(3, '2026-06-15')] },
    ]);
    const next = moveCalendarItem(r, 1, '2026-06-15');
    const d10 = next.days.find((d) => d.date === '2026-06-10')!;
    const d15 = next.days.find((d) => d.date === '2026-06-15')!;
    expect(d10.items.map((i) => i.id)).toEqual([2]);
    expect(d15.items.map((i) => i.id).sort()).toEqual([1, 3]);
    // dueDate도 갱신
    expect(d15.items.find((i) => i.id === 1)!.dueDate).toBe('2026-06-15');
  });

  it('비게된_날짜묶음은_정리됨', () => {
    const r = resp([{ date: '2026-06-10', items: [dItem(1, '2026-06-10')] }]);
    const next = moveCalendarItem(r, 1, '2026-06-20');
    expect(next.days.find((d) => d.date === '2026-06-10')).toBeUndefined();
    expect(next.days.find((d) => d.date === '2026-06-20')!.items.map((i) => i.id)).toEqual([1]);
  });

  it('대상날짜_묶음없으면_신설하고_날짜오름차순_유지', () => {
    const r = resp([
      { date: '2026-06-10', items: [dItem(1, '2026-06-10')] },
      { date: '2026-06-25', items: [dItem(2, '2026-06-25')] },
    ]);
    const next = moveCalendarItem(r, 2, '2026-06-15');
    expect(next.days.map((d) => d.date)).toEqual(['2026-06-10', '2026-06-15']);
  });

  it('없는_id면_무변경', () => {
    const r = resp([{ date: '2026-06-10', items: [dItem(1, '2026-06-10')] }]);
    expect(moveCalendarItem(r, 999, '2026-06-20')).toBe(r);
  });
});
