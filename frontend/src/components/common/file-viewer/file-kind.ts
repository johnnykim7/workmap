// 파일 종류 판별 유틸(CR-037). 공통 첨부 리스트·뷰어가 공유.
// contentType이 없거나 부정확할 수 있어 파일명 확장자도 보조로 사용한다.

export type FileKind = 'image' | 'pdf' | 'other';

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'];

function extOf(name?: string | null): string {
  if (!name) return '';
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  // 쿼리스트링 제거 후 확장자만.
  return name.slice(dot + 1).split(/[?#]/)[0].toLowerCase();
}

/** 뷰어 종류 판별. contentType 우선, 없으면 파일명/경로 확장자로 보조 판별. */
export function fileKind(contentType?: string | null, nameOrPath?: string | null): FileKind {
  const ct = (contentType || '').toLowerCase();
  if (ct.startsWith('image/')) return 'image';
  if (ct === 'application/pdf') return 'pdf';

  const ext = extOf(nameOrPath);
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

/** 라이트박스 뷰어로 열 수 있는지(이미지·PDF). 그 외는 다운로드만. */
export function isViewable(contentType?: string | null, nameOrPath?: string | null): boolean {
  return fileKind(contentType, nameOrPath) !== 'other';
}

/** 사람이 읽는 파일 크기 표기. */
export function formatFileSize(bytes?: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
