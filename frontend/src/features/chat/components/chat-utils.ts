// 채팅 공통 유틸 — 시각 포맷(date-fns 미설치 → Intl), 이니셜, HTML 공백 판정.

const timeFmt = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' });
// 날짜 구분선용 — "5월 4일 월요일" (Slack식).
const fullDateFmt = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

/** 두 ISO 시각이 같은 날짜(연·월·일)인지. 날짜 구분선·그루핑 판정용. */
export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** 날짜 구분선 라벨 — 오늘/어제는 한글로, 그 외엔 "5월 4일 월요일". */
export function formatChatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(iso, now.toISOString())) return '오늘';
  if (isSameDay(iso, yesterday.toISOString())) return '어제';
  return fullDateFmt.format(d);
}

/** 오늘이면 시각만, 그 외엔 월/일 + 시각. short=true면 항상 시:분만(그루핑 hover용). */
export function formatChatTime(iso: string, short = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (short) return timeFmt.format(d);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay ? timeFmt.format(d) : `${dateFmt.format(d)} ${timeFmt.format(d)}`;
}

export function initialOf(name?: string | null): string {
  return name?.trim()?.[0]?.toUpperCase() ?? '?';
}

/** Tiptap HTML이 사실상 빈 내용인지(태그만 있고 텍스트/이미지 없음) 판정 — 전송 가드. */
export function isEmptyHtml(html: string): boolean {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return text.length === 0;
}
