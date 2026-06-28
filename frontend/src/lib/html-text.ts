// HTML 본문 → 평문 미리보기(CR-024). description이 HTML 문자열이 된 뒤, 목록/검색/카드 등
// 미리보기 자리에서 태그가 날것으로 보이지 않도록 텍스트만 추출한다.
// 풀 렌더가 필요한 상세 화면은 RichTextEditor(editable=false)를 쓰고, 이 유틸은 미리보기 전용.

/** HTML에서 태그를 제거하고 공백을 정리한 평문을 돌려준다. 이미지 등은 표식으로 치환. */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<img\b[^>]*>/gi, ' [이미지] ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 평문 미리보기 + 길이 제한(말줄임). */
export function htmlPreview(html: string | null | undefined, maxLen = 120): string {
  const text = htmlToPlainText(html);
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}
