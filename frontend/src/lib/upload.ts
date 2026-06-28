// 파일 업로드(CR-024 — 리치 에디터 인라인 이미지). POST /files/upload → 저장 URL 반환.
// 에디터는 반환 url만 <img src>로 삽입한다(바이너리는 description에 안 들어감).
import { api } from '@/lib/api-client';

export interface FileUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export function uploadFile(file: File): Promise<FileUploadResult> {
  const form = new FormData();
  form.append('file', file);
  return api.upload<FileUploadResult>('/files/upload', form);
}
