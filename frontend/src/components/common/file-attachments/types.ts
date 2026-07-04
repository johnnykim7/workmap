// 공통 첨부 리스트 컴포넌트 타입/어댑터(CR-037).
// 컴포넌트는 도메인(work_item/chat/…)을 모른다. 소비처가 어댑터를 주입해 재사용한다.

/** 도메인 무관 첨부 항목(정규화된 뷰 모델). */
export interface AttachmentItem {
  id: number;
  fileName: string;
  /** 파일 URL(서빙 경로 또는 외부 URL). 다운로드·뷰어·img src에 사용. */
  filePath: string;
  fileSize?: number | null;
  contentType?: string | null;
  createdAt?: string | null;
}

/**
 * 첨부 데이터 연동 어댑터. 소비처가 도메인 API를 이 형태로 감싸 주입한다.
 * - 업로드 자체(POST /files/upload)는 공통(uploadFile)이라 컴포넌트가 직접 처리, 반환 결과를 create에 전달.
 */
export interface AttachmentAdapter {
  /** 현재 첨부 목록. */
  items: AttachmentItem[];
  /** 로딩 여부(스켈레톤 표시용). */
  isLoading?: boolean;
  /** 업로드 결과 메타로 첨부 등록. */
  create: (uploaded: { url: string; fileName: string; fileSize: number; contentType: string }) => Promise<unknown>;
  /** 첨부 삭제. */
  remove: (id: number) => Promise<unknown>;
  /** 쓰기 권한(없으면 업로드·삭제 UI 숨김). 기본 true. */
  canWrite?: boolean;
}
