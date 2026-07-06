// 인수조건 진척률·미충족 계산 유틸 (CR-049, WMP-WI-018).
// 충족/미충족 판정은 사람이 체크한 결과(checked)만 본다 — 자동 판정 없음(BIZ-115).
import type { AcceptanceCriterion } from '@/types/domain';

/** 미충족(checked=false) 항목 수. */
export function unmetCount(criteria: AcceptanceCriterion[] | null | undefined): number {
  return (criteria ?? []).filter((c) => !c.checked).length;
}

/** 충족(N) / 전체(M). */
export function metProgress(criteria: AcceptanceCriterion[] | null | undefined): { met: number; total: number } {
  const list = criteria ?? [];
  return { met: list.filter((c) => c.checked).length, total: list.length };
}
