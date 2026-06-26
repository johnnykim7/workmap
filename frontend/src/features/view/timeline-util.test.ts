// 타임라인 막대 배치 유틸 단위 테스트 — 구간/막대비율/월눈금/정렬(WMP-VIEW-002).
import { describe, expect, it } from 'vitest';
import {
  parseDay, itemRange, computeSpan, barMetrics, monthTicks, sortByStart,
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
