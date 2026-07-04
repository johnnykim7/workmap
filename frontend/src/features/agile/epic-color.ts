// Epic별 고유 색(CR-036) — epicId를 안정 해시해 색 팔레트에서 선택.
// 같은 Epic=항상 같은 색(Jira식 뚜렷한 색). 색은 그룹핑 신호 전용.
// badges.tsx TYPE_BG 키와 일치하는 색 이름을 반환한다.

// violet은 EpicChip 기본색이자 유형색(EPIC)이라 그룹 구분 팔레트에서 제외(다른 Epic끼리 색이 겹치게만).
const EPIC_PALETTE = ['blue', 'green', 'amber', 'red', 'slate', 'violet'] as const;
export type EpicColor = (typeof EPIC_PALETTE)[number];

// 안정 해시(문자열화한 id 기준) — 같은 id면 항상 같은 인덱스. 음수·NaN 방어.
export function epicColor(epicId?: number | null): EpicColor {
  if (epicId == null || Number.isNaN(epicId)) return 'violet';
  let h = 0;
  const s = String(epicId);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % EPIC_PALETTE.length;
  return EPIC_PALETTE[idx];
}
