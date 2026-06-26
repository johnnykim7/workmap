// 날짜 ↔ ISO(yyyy-MM-dd) 변환 헬퍼 (DatePicker ↔ BE LocalDate). 로컬타임 기준, UTC 시프트 없음.
export function toIso(d?: Date): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromIso(s?: string | null): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

// 사람용 짧은 날짜 표시(yyyy.MM.dd). 빈 값은 '–'.
export function fmtDate(s?: string | null): string {
  if (!s) return '–';
  return s.slice(0, 10).replace(/-/g, '.');
}

// 상대/절대 시각(yyyy.MM.dd HH:mm) — 활동이력/댓글용.
export function fmtDateTime(s?: string | null): string {
  if (!s) return '–';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '–';
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}
