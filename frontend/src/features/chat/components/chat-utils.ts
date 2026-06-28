// 채팅 공통 유틸 — 시각 포맷(date-fns 미설치 → Intl), 이니셜, HTML 공백 판정.

const timeFmt = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' });

/** 오늘이면 시각만, 그 외엔 월/일 + 시각. */
export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
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
