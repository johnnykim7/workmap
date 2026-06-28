// 타임라인 막대 배치 유틸 단위 테스트 — 구간/막대비율/월눈금/정렬(WMP-VIEW-002).
import { describe, expect, it } from 'vitest';
import {
  parseDay, itemRange, computeSpan, barMetrics, monthTicks, weekTicks, dayTicks, quarterTicks,
  ticksFor, spanFor, todayMarker, groupByEpic, rollupMetrics, sortByStart,
} from './timeline-util';
import type { TimelineItem } from './api';

function item(over: Partial<TimelineItem> = {}): TimelineItem {
  return {
    id: 1, key: 'WMP-1', title: 't', issueType: 'TASK', commonStatus: 'TODO',
    priority: 'MEDIUM', assigneeId: null, epicId: null,
    startDate: null, dueDate: null, progress: 0, ...over,
  };
}

describe('parseDay', () => {
  it('정상_yyyyMMdd_epoch반환', () => {
    expect(parseDay('2026-01-01')).toBe(Date.parse('2026-01-01T00:00:00Z'));
  });
  it('null_또는_빈값_null반환', () => {
    expect(parseDay(null)).toBeNull();
    expect(parseDay('')).toBeNull();
  });
  it('잘못된형식_null반환', () => {
    expect(parseDay('not-a-date')).toBeNull();
  });
});

describe('itemRange', () => {
  it('둘다없음_null', () => {
    expect(itemRange(item())).toBeNull();
  });
  it('한쪽만있음_같은날로보정', () => {
    const r = itemRange(item({ startDate: '2026-01-10' }))!;
    expect(r.start).toBe(r.end);
  });
  it('역순입력_정렬보정', () => {
    const r = itemRange(item({ startDate: '2026-01-20', dueDate: '2026-01-10' }))!;
    expect(r.start).toBeLessThan(r.end);
  });
});

describe('computeSpan', () => {
  it('일정없는항목만_null', () => {
    expect(computeSpan([item(), item()])).toBeNull();
  });
  it('여러항목_전체min_max', () => {
    const span = computeSpan([
      item({ startDate: '2026-01-05', dueDate: '2026-01-10' }),
      item({ startDate: '2026-02-01', dueDate: '2026-02-20' }),
    ])!;
    expect(span.min).toBe(Date.parse('2026-01-05T00:00:00Z'));
    expect(span.max).toBe(Date.parse('2026-02-20T00:00:00Z'));
  });
  it('단일일자항목_최소1일폭보장', () => {
    const span = computeSpan([item({ dueDate: '2026-01-10' })])!;
    expect(span.max).toBeGreaterThan(span.min);
  });
});

describe('barMetrics', () => {
  const span = computeSpan([
    item({ startDate: '2026-01-01', dueDate: '2026-01-31' }),
  ])!;
  it('일정없음_null', () => {
    expect(barMetrics(item(), span)).toBeNull();
  });
  it('구간시작항목_left0', () => {
    const m = barMetrics(item({ startDate: '2026-01-01', dueDate: '2026-01-31' }), span)!;
    expect(m.left).toBe(0);
    expect(m.width).toBeCloseTo(100, 0);
  });
  it('left_width_합_100이내', () => {
    const m = barMetrics(item({ startDate: '2026-01-15', dueDate: '2026-01-31' }), span)!;
    expect(m.left + m.width).toBeLessThanOrEqual(100.01);
  });
});

describe('monthTicks', () => {
  it('두달구간_월눈금생성', () => {
    const span = computeSpan([item({ startDate: '2026-01-05', dueDate: '2026-03-10' })])!;
    const ticks = monthTicks(span);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks.map((t) => t.label)).toContain('2월');
  });
});

describe('weekTicks (CR-021 주 단위)', () => {
  it('한달구간_주눈금_여러개_M_d라벨', () => {
    // 2026-06-01(월)~06-30(화). 일요일 시작 주 눈금: 6/7, 6/14, 6/21, 6/28
    const span = computeSpan([item({ startDate: '2026-06-01', dueDate: '2026-06-30' })])!;
    const ticks = weekTicks(span);
    const labels = ticks.map((t) => t.label);
    expect(labels).toContain('6/7');
    expect(labels).toContain('6/14');
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });

  it('모든_눈금_left가_0~100_범위', () => {
    const span = computeSpan([item({ startDate: '2026-05-10', dueDate: '2026-07-20' })])!;
    for (const t of weekTicks(span)) {
      expect(t.left).toBeGreaterThanOrEqual(0);
      expect(t.left).toBeLessThanOrEqual(100);
    }
  });

  it('주_시작은_일요일', () => {
    // 2026-06-07은 일요일.
    const span = computeSpan([item({ startDate: '2026-06-07', dueDate: '2026-06-21' })])!;
    expect(weekTicks(span).map((t) => t.label)).toContain('6/7');
  });
});

describe('ticksFor (단위 선택)', () => {
  it('month면_monthTicks와_동일', () => {
    const span = computeSpan([item({ startDate: '2026-01-05', dueDate: '2026-03-10' })])!;
    expect(ticksFor('month', span)).toEqual(monthTicks(span));
  });
  it('week면_weekTicks와_동일', () => {
    const span = computeSpan([item({ startDate: '2026-06-01', dueDate: '2026-06-30' })])!;
    expect(ticksFor('week', span)).toEqual(weekTicks(span));
  });
});

describe('dayTicks (CR-023 오늘 줌)', () => {
  it('짧은구간_일별눈금', () => {
    const span = computeSpan([item({ startDate: '2026-06-10', dueDate: '2026-06-13' })])!;
    const labels = dayTicks(span).map((t) => t.label);
    expect(labels).toContain('6/11');
    expect(labels).toContain('6/13');
  });
});

describe('quarterTicks (CR-023)', () => {
  it('여러분기구간_Q라벨', () => {
    const span = computeSpan([item({ startDate: '2026-01-05', dueDate: '2026-09-20' })])!;
    const labels = quarterTicks(span).map((t) => t.label);
    expect(labels).toContain('2026 Q2');
    expect(labels).toContain('2026 Q3');
  });
});

describe('ticksFor (CR-023 4단위)', () => {
  const span = computeSpan([item({ startDate: '2026-01-05', dueDate: '2026-09-20' })])!;
  it('today=dayTicks · quarter=quarterTicks', () => {
    expect(ticksFor('today', span)).toEqual(dayTicks(span));
    expect(ticksFor('quarter', span)).toEqual(quarterTicks(span));
  });
  it('week·month 기존동일', () => {
    expect(ticksFor('week', span)).toEqual(weekTicks(span));
    expect(ticksFor('month', span)).toEqual(monthTicks(span));
  });
});

describe('spanFor (CR-023 구간 한정 + 줌)', () => {
  const today = Date.parse('2026-06-15T09:00:00Z');
  it('단위가_클수록_표시구간이_넓다', () => {
    const t = spanFor('today', today);
    const w = spanFor('week', today);
    const m = spanFor('month', today);
    const q = spanFor('quarter', today);
    expect(w.totalDays).toBeGreaterThan(t.totalDays);
    expect(m.totalDays).toBeGreaterThan(w.totalDays);
    expect(q.totalDays).toBeGreaterThan(m.totalDays);
  });
  it('오늘이_창_안에_포함', () => {
    for (const s of [spanFor('today', today), spanFor('quarter', today)]) {
      expect(today).toBeGreaterThanOrEqual(s.min);
      expect(today).toBeLessThanOrEqual(s.max);
    }
  });
});

describe('todayMarker (CR-023)', () => {
  const today = Date.parse('2026-06-15T00:00:00Z');
  it('창안이면_0~100', () => {
    const span = spanFor('month', today);
    const left = todayMarker(span, today)!;
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThan(100);
  });
  it('창밖이면_null', () => {
    const span = computeSpan([item({ startDate: '2020-01-01', dueDate: '2020-02-01' })])!;
    expect(todayMarker(span, today)).toBeNull();
  });
});

describe('groupByEpic (CR-023 WBS)', () => {
  it('에픽별로_묶고_에픽없음은_맨끝', () => {
    const names = new Map<number, string>([[10, '입고'], [20, '출고']]);
    const groups = groupByEpic([
      item({ id: 1, epicId: 10, startDate: '2026-06-05', dueDate: '2026-06-10' }),
      item({ id: 2, epicId: null, startDate: '2026-06-01', dueDate: '2026-06-02' }),
      item({ id: 3, epicId: 20, startDate: '2026-06-20', dueDate: '2026-06-25' }),
      item({ id: 4, epicId: 10, startDate: '2026-06-12', dueDate: '2026-06-15' }),
    ], names);
    // 입고(롤업 6/5) → 출고(6/20) → (에픽 없음) 순.
    expect(groups.map((g) => g.name)).toEqual(['입고', '출고', '(에픽 없음)']);
    expect(groups[groups.length - 1].isNoEpic).toBe(true);
    expect(groups[0].children.map((c) => c.id)).toEqual([1, 4]); // 그룹 내 start 오름차순
  });
  it('에픽자체(EPIC)는_자식에서_제외', () => {
    const groups = groupByEpic([
      item({ id: 9, issueType: 'EPIC', epicId: null, startDate: '2026-06-01', dueDate: '2026-06-30' }),
      item({ id: 1, epicId: 9, startDate: '2026-06-05', dueDate: '2026-06-10' }),
    ], new Map([[9, '입고']]));
    const all = groups.flatMap((g) => g.children.map((c) => c.id));
    expect(all).not.toContain(9);
  });
  it('이름없는_에픽은_폴백라벨', () => {
    const groups = groupByEpic([item({ id: 1, epicId: 77, startDate: '2026-06-05' })], new Map());
    expect(groups[0].name).toBe('에픽 #77');
  });
  it('롤업은_자식_min(start)~max(due)', () => {
    const groups = groupByEpic([
      item({ id: 1, epicId: 10, startDate: '2026-06-05', dueDate: '2026-06-10' }),
      item({ id: 2, epicId: 10, startDate: '2026-06-20', dueDate: '2026-06-28' }),
    ], new Map([[10, 'E']]));
    expect(groups[0].rollup!.start).toBe(parseDay('2026-06-05'));
    expect(groups[0].rollup!.end).toBe(parseDay('2026-06-28'));
  });
});

describe('rollupMetrics (CR-023)', () => {
  it('구간내_left_width_100이내', () => {
    const span = computeSpan([item({ startDate: '2026-06-01', dueDate: '2026-06-30' })])!;
    const m = rollupMetrics({ start: parseDay('2026-06-10')!, end: parseDay('2026-06-20')! }, span);
    expect(m.left).toBeGreaterThan(0);
    expect(m.left + m.width).toBeLessThanOrEqual(100.01);
  });
});

describe('sortByStart', () => {
  it('start오름차순_일정없음은뒤로', () => {
    const sorted = sortByStart([
      item({ id: 3, startDate: null }),
      item({ id: 1, startDate: '2026-01-01' }),
      item({ id: 2, startDate: '2026-02-01' }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual([1, 2, 3]);
  });
});
