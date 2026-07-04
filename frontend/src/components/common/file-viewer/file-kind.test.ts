// 파일 종류 판별 유틸 단위테스트(CR-037).
import { describe, expect, it } from 'vitest';
import { fileKind, isViewable, formatFileSize } from './file-kind';

describe('fileKind', () => {
  it('contentType이_image면_image', () => {
    expect(fileKind('image/png', 'x.bin')).toBe('image');
    expect(fileKind('image/jpeg')).toBe('image');
  });

  it('contentType이_pdf면_pdf', () => {
    expect(fileKind('application/pdf', 'doc')).toBe('pdf');
  });

  it('contentType없으면_확장자로_판별', () => {
    expect(fileKind(null, 'photo.PNG')).toBe('image');
    expect(fileKind(undefined, 'report.pdf')).toBe('pdf');
    expect(fileKind(null, '/api/v1/files/serve/abc.webp')).toBe('image');
  });

  it('쿼리스트링_붙은_URL도_확장자_판별', () => {
    expect(fileKind(null, 'a.png?v=3')).toBe('image');
  });

  it('알수없으면_other', () => {
    expect(fileKind('application/zip', 'a.zip')).toBe('other');
    expect(fileKind(null, 'a.docx')).toBe('other');
    expect(fileKind(null, 'noext')).toBe('other');
  });
});

describe('isViewable', () => {
  it('이미지·PDF만_뷰가능', () => {
    expect(isViewable('image/png')).toBe(true);
    expect(isViewable(null, 'a.pdf')).toBe(true);
    expect(isViewable(null, 'a.zip')).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('단위환산', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
    expect(formatFileSize(null)).toBe('');
  });
});
