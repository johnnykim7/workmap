// work_item(TimelineItem) ↔ SVAR React Gantt(ITask/ILink) 매핑 (CR-035, WMP-VIEW-005).
// SVAR task = { id, text, start:Date, end:Date, progress(0~100), parent, type } + 커스텀 필드([key:string]:any).
// SVAR link = { id, source, target, type: 'e2s'(End-to-Start) }.
// 순수 변환만 — 단위테스트 대상. 렌더/이벤트는 TimelineChart가 담당.
import type { ITask, ILink } from '@svar-ui/react-gantt';
import type { TimelineItem, TimelineLink } from './api';
import { itemRange } from './timeline-util';

// 에픽 요약행 id 오프셋(work_item id와 충돌 방지 — 음수 공간 사용).
// 에픽 자체는 work_item(EPIC)이지만 타임라인은 에픽을 "summary 그룹행"으로만 그리므로
// 실제 에픽 work_item id를 그대로 summary task id로 재사용한다(양수). 자식 parent=epicId.
// "(에픽 없음)" 그룹은 EPICLESS_ID(음수)로.
export const EPICLESS_ID = -1;

/** SVAR task에 실어 보내는 커스텀 메타(막대/그리드 커스텀 렌더에서 사용). */
export interface GanttTaskMeta {
  wmpKey: string;          // WMP-123
  issueType: string;
  commonStatus: string;
  critical: boolean;       // 크리티컬 패스 소속(FE 계산 주입)
  isEpicRow: boolean;      // 에픽 요약행 여부
}

export type GanttTask = ITask & GanttTaskMeta & { id: number; parent: number };

/**
 * TimelineItem[] → SVAR task[]. 에픽을 summary 행으로 세우고 하위를 parent=epicId로 묶는다.
 * - epicNames: epicId→title. 요약행 text에 사용.
 * - criticalNodeIds: 크리티컬 패스 노드 집합(FE criticalPath 결과) — task.critical 주입.
 * - 일정 없는 항목(start·due 둘 다 없음)은 간트에서 제외(기존 규약).
 * - issueType=EPIC인 항목은 자식 행으로 그리지 않음(요약행으로만 등장).
 */
export function toGanttTasks(
  items: TimelineItem[],
  epicNames: Map<number, string>,
  criticalNodeIds: Set<number>,
): GanttTask[] {
  // 자식(에픽 아님 + 일정 있음)만.
  const children = items.filter((it) => it.issueType !== 'EPIC' && itemRange(it) !== null);

  // 등장하는 에픽 그룹 키 수집(자식의 epicId 분포). null → EPICLESS.
  const usedEpicIds = new Set<number>();
  let hasEpicless = false;
  for (const it of children) {
    if (it.epicId != null) usedEpicIds.add(it.epicId);
    else hasEpicless = true;
  }

  const tasks: GanttTask[] = [];

  // 에픽 요약행(자식이 있는 에픽만).
  for (const epicId of usedEpicIds) {
    tasks.push(makeEpicRow(epicId, epicNames.get(epicId) ?? `에픽 #${epicId}`));
  }
  if (hasEpicless) {
    tasks.push(makeEpicRow(EPICLESS_ID, '(에픽 없음)'));
  }

  // 자식 행.
  const DAY = 86_400_000;
  for (const it of children) {
    const r = itemRange(it)!;
    // start==end(한쪽 날짜만 있음)면 SVAR가 폭 0 막대를 못 그리므로 최소 1일 폭 보장.
    const endMs = r.end > r.start ? r.end : r.start + DAY;
    tasks.push({
      id: it.id,
      text: it.title,
      start: new Date(r.start),
      end: new Date(endMs),
      progress: clampProgress(it.progress),
      type: 'task',
      parent: it.epicId ?? EPICLESS_ID,
      wmpKey: it.key,
      issueType: it.issueType,
      commonStatus: it.commonStatus,
      critical: criticalNodeIds.has(it.id),
      isEpicRow: false,
    });
  }
  return tasks;
}

function makeEpicRow(epicId: number, title: string): GanttTask {
  return {
    id: epicId,
    text: title,
    // start/end는 SVAR가 summary 자식 롤업으로 자동 계산 — 임의값 넣지 않음(생략).
    progress: 0,
    type: 'summary',
    parent: 0,
    open: true,   // 기본 펼침(하위 항목 막대 노출)
    wmpKey: '',
    issueType: 'EPIC',
    commonStatus: '',
    critical: false,
    isEpicRow: true,
  } as GanttTask;
}

function clampProgress(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, Math.round(p)));
}

/**
 * TimelineLink[] → SVAR link[]. BLOCKS(선행→후행) = End-to-Start(e2s).
 * criticalEdgeKeys("s>t")에 속하면 커스텀 필드 critical=true(링크선 강조용).
 */
export interface GanttLink extends ILink {
  id: string;
  critical: boolean;
}

export function toGanttLinks(links: TimelineLink[], criticalEdgeKeys: Set<string>): GanttLink[] {
  return links.map((l) => ({
    id: `${l.sourceId}>${l.targetId}`,
    source: l.sourceId,
    target: l.targetId,
    type: 'e2s' as const,
    critical: criticalEdgeKeys.has(`${l.sourceId}>${l.targetId}`),
  }));
}

/** SVAR update-task에서 받은 task → BE PATCH 바디(startDate/dueDate, yyyy-MM-dd). */
export function toDatePatch(task: ITask): { startDate?: string; dueDate?: string } {
  const patch: { startDate?: string; dueDate?: string } = {};
  if (task.start instanceof Date) patch.startDate = ymd(task.start);
  if (task.end instanceof Date) patch.dueDate = ymd(task.end);
  return patch;
}

/** Date → yyyy-MM-dd(로컬 기준 — 간트 표시와 일치). */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
