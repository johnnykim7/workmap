// 공통 파일 뷰어 타입(CR-037).

export interface ViewerFile {
  /** 파일 URL(서빙 경로 또는 외부 URL). */
  url: string;
  /** 표시용 파일명. */
  name: string;
  /** MIME 타입(옵션 — 없으면 확장자로 판별). */
  contentType?: string | null;
}

export interface FileViewerContextValue {
  /** 라이트박스 열기. files 중 startIndex부터 표시(이미지 좌우 이동은 files 내 image만 순회). */
  open: (files: ViewerFile[], startIndex?: number) => void;
  /** 단일 파일 열기 단축. */
  openOne: (file: ViewerFile) => void;
  close: () => void;
}
