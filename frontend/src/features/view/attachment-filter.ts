// 프로젝트 첨부 집계 필터 순수 로직(WMP-VIEW-007, CR-044) — react/ds-ui 무의존, 단위테스트 친화.
// Jira "첨부 파일" 탭 필터바에 대응: 파일명 검색·업로더·유형·추가일(기간).
import type { ProjectAttachmentItem } from './api';

// 파일 대분류(필터 옵션). contentType/확장자 기준으로 묶는다.
export type AttachmentKind = 'image' | 'pdf' | 'doc' | 'sheet' | 'archive' | 'other';

const EXT_KIND: Record<string, AttachmentKind> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image',
  pdf: 'pdf',
  doc: 'doc', docx: 'doc', txt: 'doc', md: 'doc', rtf: 'doc', hwp: 'doc',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet',
  zip: 'archive', rar: 'archive', '7z': 'archive', gz: 'archive', tar: 'archive',
};

/** 파일의 대분류. contentType 우선(image/*·pdf), 없으면 확장자로 판별. */
export function attachmentKind(item: Pick<ProjectAttachmentItem, 'contentType' | 'fileName'>): AttachmentKind {
  const ct = (item.contentType ?? '').toLowerCase();
  if (ct.startsWith('image/')) return 'image';
  if (ct === 'application/pdf') return 'pdf';
  const ext = item.fileName.toLowerCase().split('.').pop() ?? '';
  return EXT_KIND[ext] ?? 'other';
}

export interface AttachmentFilter {
  keyword?: string;        // 파일명 부분일치(대소문자 무시)
  uploaderName?: string;   // 업로더 정확일치(드롭다운 선택값)
  kind?: AttachmentKind;   // 파일 유형
  from?: string;           // 추가일 시작(yyyy-MM-dd, 포함)
  to?: string;             // 추가일 끝(yyyy-MM-dd, 포함)
}

// createdAt(ISO) → 로컬 날짜 yyyy-MM-dd (기간 필터 비교용).
function localDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 필터 적용. 지정되지 않은 조건은 통과(AND 결합). 입력 순서(최신순)는 보존. */
export function filterAttachments(
  items: ProjectAttachmentItem[],
  f: AttachmentFilter,
): ProjectAttachmentItem[] {
  const kw = f.keyword?.trim().toLowerCase();
  return items.filter((it) => {
    if (kw && !it.fileName.toLowerCase().includes(kw)) return false;
    if (f.uploaderName && (it.uploaderName ?? '') !== f.uploaderName) return false;
    if (f.kind && attachmentKind(it) !== f.kind) return false;
    if (f.from || f.to) {
      const d = localDate(it.createdAt);
      if (f.from && d < f.from) return false;
      if (f.to && d > f.to) return false;
    }
    return true;
  });
}

/** 목록에 등장하는 업로더 이름(중복 제거, 등장 순서). 업로더 드롭다운 옵션용. */
export function uploaderOptions(items: ProjectAttachmentItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const n = it.uploaderName;
    if (n && !seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out;
}
