// 프로젝트 첨부 집계 필터 순수 로직 단위 테스트(WMP-VIEW-007, CR-044).
import { describe, expect, it } from 'vitest';
import {
  attachmentKind, filterAttachments, uploaderOptions, type AttachmentFilter,
} from './attachment-filter';
import type { ProjectAttachmentItem } from './api';

function att(over: Partial<ProjectAttachmentItem>): ProjectAttachmentItem {
  return {
    id: 1, fileName: 'a.png', filePath: '/files/serve/a.png', fileSize: 1024,
    contentType: 'image/png', createdAt: '2026-07-01T09:00:00+09:00',
    workItemId: 10, workItemKey: 'WMP-10', workItemSummary: '요약', uploaderName: '홍길동',
    ...over,
  };
}

describe('attachmentKind', () => {
  it('contentType_image_우선', () => {
    expect(attachmentKind(att({ contentType: 'image/jpeg', fileName: 'x.bin' }))).toBe('image');
  });
  it('pdf_contentType', () => {
    expect(attachmentKind(att({ contentType: 'application/pdf', fileName: 'x' }))).toBe('pdf');
  });
  it('확장자_폴백', () => {
    expect(attachmentKind(att({ contentType: null, fileName: 'plan.docx' }))).toBe('doc');
    expect(attachmentKind(att({ contentType: null, fileName: 'data.csv' }))).toBe('sheet');
    expect(attachmentKind(att({ contentType: null, fileName: 'src.zip' }))).toBe('archive');
    expect(attachmentKind(att({ contentType: null, fileName: 'unknown.xyz' }))).toBe('other');
  });
});

describe('filterAttachments', () => {
  const items = [
    att({ id: 1, fileName: 'report.pdf', contentType: 'application/pdf', uploaderName: '홍길동', createdAt: '2026-07-01T09:00:00+09:00' }),
    att({ id: 2, fileName: 'diagram.png', contentType: 'image/png', uploaderName: '김철수', createdAt: '2026-07-10T09:00:00+09:00' }),
    att({ id: 3, fileName: 'notes.txt', contentType: 'text/plain', uploaderName: '홍길동', createdAt: '2026-07-20T09:00:00+09:00' }),
  ];

  it('빈필터_전체통과_순서보존', () => {
    const res = filterAttachments(items, {});
    expect(res.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('파일명_부분일치_대소문자무시', () => {
    expect(filterAttachments(items, { keyword: 'DIA' }).map((r) => r.id)).toEqual([2]);
  });

  it('업로더_정확일치', () => {
    expect(filterAttachments(items, { uploaderName: '홍길동' }).map((r) => r.id)).toEqual([1, 3]);
  });

  it('유형_필터', () => {
    expect(filterAttachments(items, { kind: 'image' }).map((r) => r.id)).toEqual([2]);
    expect(filterAttachments(items, { kind: 'pdf' }).map((r) => r.id)).toEqual([1]);
  });

  it('기간_from_to_포함경계', () => {
    const f: AttachmentFilter = { from: '2026-07-05', to: '2026-07-15' };
    expect(filterAttachments(items, f).map((r) => r.id)).toEqual([2]);
  });

  it('AND_결합', () => {
    expect(filterAttachments(items, { uploaderName: '홍길동', kind: 'pdf' }).map((r) => r.id)).toEqual([1]);
  });
});

describe('uploaderOptions', () => {
  it('중복제거_등장순서', () => {
    const items = [
      att({ id: 1, uploaderName: '홍길동' }),
      att({ id: 2, uploaderName: '김철수' }),
      att({ id: 3, uploaderName: '홍길동' }),
      att({ id: 4, uploaderName: null }),
    ];
    expect(uploaderOptions(items)).toEqual(['홍길동', '김철수']);
  });
});
