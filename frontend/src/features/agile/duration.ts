// 스프린트 기간 프리셋(CR-038, WMP-AGL-007) — 시작일 기준 종료일 자동계산.
// Jira 편집 폼의 "기간(사용자 지정/1주/2주/3주/4주)" 대응. 순수 함수(단위테스트 대상).

export type DurationPreset = 'CUSTOM' | '1W' | '2W' | '3W' | '4W';

export const DURATION_PRESETS: { value: DurationPreset; label: string; weeks?: number }[] = [
  { value: 'CUSTOM', label: '사용자 지정' },
  { value: '1W', label: '1주', weeks: 1 },
  { value: '2W', label: '2주', weeks: 2 },
  { value: '3W', label: '3주', weeks: 3 },
  { value: '4W', label: '4주', weeks: 4 },
];

const WEEKS: Record<DurationPreset, number | null> = {
  CUSTOM: null,
  '1W': 1,
  '2W': 2,
  '3W': 3,
  '4W': 4,
};

/**
 * 프리셋 + 시작일(yyyy-mm-dd) → 종료일(yyyy-mm-dd).
 * Jira 관례: 2주 스프린트 = 시작일 + (2*7 - 1)일(시작일 포함 만 14일의 마지막 날).
 * CUSTOM이거나 시작일이 없으면 null(종료일 직접 입력).
 */
export function endDateFor(preset: DurationPreset, startDate?: string): string | null {
  const weeks = WEEKS[preset];
  if (weeks == null || !startDate) return null;
  const [y, m, d] = startDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d);
  start.setDate(start.getDate() + weeks * 7 - 1);
  const yy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * 시작일·종료일(yyyy-mm-dd) → 매칭되는 프리셋(정확히 N주면 그 프리셋, 아니면 CUSTOM).
 * 편집 다이얼로그 오픈 시 기존 기간에서 프리셋 초기값 역산용.
 */
export function presetFor(startDate?: string, endDate?: string): DurationPreset {
  if (!startDate || !endDate) return 'CUSTOM';
  for (const p of ['1W', '2W', '3W', '4W'] as DurationPreset[]) {
    if (endDateFor(p, startDate) === endDate) return p;
  }
  return 'CUSTOM';
}
