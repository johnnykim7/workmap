// gantt-adapter 단위테스트 (CR-035) — work_item→SVAR task/link 매핑.
import { describe, expect, it } from 'vitest';
import { toGanttTasks, toGanttLinks, toDatePatch, ymd, EPICLESS_ID } from './gantt-adapter';
import type { TimelineItem, TimelineLink } from './api';

function item(over: Partial<TimelineItem> = {}): TimelineItem {
  return {
    id: 1, key: 'WMP-1', title: 't', issueType: 'TASK', commonStatus: 'TODO',
    priority: 'MEDIUM', assigneeId: null, epicId: null,
    startDate: '2026-07-01', dueDate: '2026-07-10', progress: 0, ...over,
  };
}

describe('toGanttTasks', () => {
  it('에픽있는항목_summary행_생성', () => {
    const tasks = toGanttTasks(
      [item({ id: 1, epicId: 100 })],
      new Map([[100, '에픽A']]),
      new Set(),
    );
    const epic = tasks.find((t) => t.id === 100)!;
    expect(epic.type).toBe('summary');
    expect(epic.text).toBe('에픽A');
    expect(epic.isEpicRow).toBe(true);
    const child = tasks.find((t) => t.id === 1)!;
    expect(child.parent).toBe(100);
    expect(child.type).toBe('task');
  });

  it('에픽없는항목_EPICLESS그룹', () => {
    const tasks = toGanttTasks([item({ id: 1, epicId: null })], new Map(), new Set());
    expect(tasks.some((t) => t.id === EPICLESS_ID && t.type === 'summary')).toBe(true);
    expect(tasks.find((t) => t.id === 1)!.parent).toBe(EPICLESS_ID);
  });

  it('일정없는항목_제외', () => {
    const tasks = toGanttTasks(
      [item({ id: 1, startDate: null, dueDate: null })],
      new Map(), new Set(),
    );
    expect(tasks.find((t) => t.id === 1)).toBeUndefined();
  });

  it('EPIC유형항목_자식행아님', () => {
    const tasks = toGanttTasks(
      [item({ id: 5, issueType: 'EPIC' })],
      new Map(), new Set(),
    );
    // EPIC 항목 자체는 자식 task로 안 들어감(요약행은 자식의 epicId로만 생성).
    expect(tasks.find((t) => t.id === 5 && t.type === 'task')).toBeUndefined();
  });

  it('크리티컬노드_critical플래그', () => {
    const tasks = toGanttTasks([item({ id: 1 })], new Map(), new Set([1]));
    expect(tasks.find((t) => t.id === 1)!.critical).toBe(true);
  });

  it('progress_0~100_클램프', () => {
    const tasks = toGanttTasks([item({ id: 1, progress: 150 })], new Map(), new Set());
    expect(tasks.find((t) => t.id === 1)!.progress).toBe(100);
  });

  it('start_end_Date객체', () => {
    const tasks = toGanttTasks([item({ id: 1 })], new Map(), new Set());
    const t = tasks.find((x) => x.id === 1)!;
    expect(t.start).toBeInstanceOf(Date);
    expect(t.end).toBeInstanceOf(Date);
  });
});

describe('toGanttLinks', () => {
  const links: TimelineLink[] = [{ sourceId: 1, targetId: 2, linkType: 'BLOCKS' }];

  it('BLOCKS_e2s매핑', () => {
    const g = toGanttLinks(links, new Set());
    expect(g[0].type).toBe('e2s');
    expect(g[0].source).toBe(1);
    expect(g[0].target).toBe(2);
    expect(g[0].id).toBe('1>2');
  });

  it('크리티컬엣지_critical플래그', () => {
    const g = toGanttLinks(links, new Set(['1>2']));
    expect(g[0].critical).toBe(true);
  });
});

describe('toDatePatch / ymd', () => {
  it('ymd_로컬yyyyMMdd', () => {
    expect(ymd(new Date(2026, 6, 5))).toBe('2026-07-05'); // month=6 → 7월
  });

  it('toDatePatch_start_end변환', () => {
    const patch = toDatePatch({ start: new Date(2026, 6, 1), end: new Date(2026, 6, 10) });
    expect(patch.startDate).toBe('2026-07-01');
    expect(patch.dueDate).toBe('2026-07-10');
  });
});
