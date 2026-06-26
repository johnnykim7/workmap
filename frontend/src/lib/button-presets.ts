// 액션 유형 → ds-ui Button variant 매핑 (CLAUDE.md: 한 곳에서 관리, 개별 화면 색 직접지정 금지).
// 생성/저장=primary · 수정=secondary · 삭제=destructive · 취소/보조=ghost.
export const BTN_VARIANT = {
  create: 'primary',
  save: 'primary',
  edit: 'secondary',
  delete: 'destructive',
  cancel: 'ghost',
  secondary: 'ghost',
} as const;

export type ButtonAction = keyof typeof BTN_VARIANT;
